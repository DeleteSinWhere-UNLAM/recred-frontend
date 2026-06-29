import { of, throwError } from 'rxjs';
import { SugerenciasPresenter } from './sugerencias.presenter';
import { SugerenciasService } from '../services/sugerencias.service';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { SugerenciaProducto, ComboSuggestion } from '../models/sugerencia-producto.model';
import { Producto } from '../../inventario/models/producto.interface';
import { Promotion } from '../../../data-access/services/promociones/promotion.service';

class SugerenciasMother {
  static crearSugerencia(override: Partial<any> = {}): SugerenciaProducto {
    return {
      productoOriginal: 'Producto Base',
      estadisticasVenta: {
        productoId: 'p1',
        stockActual: 10,
        diasSinVenta: 5,
        ventasPeriodo: 100
      },
      ...override
    } as unknown as SugerenciaProducto;
  }

  static crearSugerencias(): SugerenciaProducto[] {
    return [
      this.crearSugerencia({
        productoOriginal: 'Producto 1',
        estadisticasVenta: { productoId: 'p1', stockActual: 10, diasSinVenta: 5, ventasPeriodo: 100 }
      }),
      this.crearSugerencia({
        productoOriginal: 'Producto 2',
        estadisticasVenta: { productoId: 'p2', stockActual: 20, diasSinVenta: 10, ventasPeriodo: 200 }
      })
    ];
  }

  static crearComboSuggestion(): ComboSuggestion {
    return {
      idProduct: 'p1',
      productName: 'Producto 1',
      suggestedProducts: [{ id: 'c1', nombre: 'Combo 1', precio: 100 }]
    };
  }

  static crearProducto(): Producto {
    return {
      id: 'p1',
      nombre: 'Producto 1',
      descripcion: 'Desc',
      precio: 100,
      peso: 1,
      requierePreparacion: false,
      stockActual: 10,
      urlImagen: 'http://image.url'
    } as unknown as Producto;
  }
}

describe('SugerenciasPresenter', () => {
  let presenter: SugerenciasPresenter;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasService>;
  let servicioPromociones: jasmine.SpyObj<PromotionService>;
  let router: jasmine.SpyObj<Router>;
  let toast: jasmine.SpyObj<ToastService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;

  beforeEach(() => {
    servicioSugerencias = jasmine.createSpyObj('SugerenciasService', ['getSugerencias', 'getComboSuggestions']);
    servicioPromociones = jasmine.createSpyObj('PromotionService', ['createPromotion']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioProducto = jasmine.createSpyObj('ProductoService', ['getById']);

    presenter = new SugerenciasPresenter(
      servicioSugerencias,
      servicioPromociones,
      router,
      toast,
      servicioProducto
    );
  });

  describe('Inicialización', () => {
    it('debería solicitar las sugerencias al servicio y seleccionar el primer producto automáticamente', () => {
      const sugerencias = SugerenciasMother.crearSugerencias();
      servicioSugerencias.getSugerencias.and.returnValue(of(sugerencias));
      let sugerenciaActiva: SugerenciaProducto | undefined;
      let sugerenciasEmitidas: SugerenciaProducto[] = [];
      presenter.sugerencias$.subscribe(val => sugerenciasEmitidas = val);
      presenter.sugerenciaSeleccionada$.subscribe(val => sugerenciaActiva = val);

      presenter.initialize('user-1');

      expect(servicioSugerencias.getSugerencias).toHaveBeenCalled();
      expect(sugerenciasEmitidas).toEqual(sugerencias);
      expect(sugerenciaActiva).toEqual(sugerencias[0]);
      expect(presenter.totalProductosAnalizados).toBe(2);
      expect(presenter.totalStockInmovilizado).toBe(30);
      expect(presenter.promedioDiasSinVenta).toBe(8);
      expect(presenter.productoMasCritico?.productoOriginal).toBe('Producto 2');
    });

    it('no debería seleccionar ningún producto ni fallar cuando el servicio retorna una lista vacía', () => {
      servicioSugerencias.getSugerencias.and.returnValue(of([]));
      let sugerenciaActiva: SugerenciaProducto | undefined;
      presenter.sugerenciaSeleccionada$.subscribe(val => sugerenciaActiva = val);

      presenter.initialize('user-1');

      expect(sugerenciaActiva).toBeUndefined();
      expect(presenter.totalProductosAnalizados).toBe(0);
      expect(presenter.totalStockInmovilizado).toBe(0);
      expect(presenter.promedioDiasSinVenta).toBe(0);
    });
  });

  describe('Modal de Promociones de Combos', () => {
    it('debería cargar sugerencias de combo y abrir el modal cuando hay un producto activo', () => {
      const sugerencia = SugerenciasMother.crearSugerencia();
      presenter.seleccionarProducto(sugerencia);
      servicioSugerencias.getComboSuggestions.and.returnValue(of(SugerenciasMother.crearComboSuggestion()));
      let modalAbierto = false;
      presenter.isComboModalOpen$.subscribe(val => modalAbierto = val);

      presenter.openComboPromotionModal();

      expect(servicioSugerencias.getComboSuggestions).toHaveBeenCalledWith('p1');
      expect(modalAbierto).toBeTrue();
    });

    it('no debería ejecutar ninguna acción al solicitar abrir el modal sin un producto activo', () => {
      let modalAbierto = false;
      presenter.isComboModalOpen$.subscribe(val => modalAbierto = val);

      presenter.openComboPromotionModal();

      expect(servicioSugerencias.getComboSuggestions).not.toHaveBeenCalled();
      expect(modalAbierto).toBeFalse();
    });

    it('debería cerrar el modal y vaciar los productos sugeridos al solicitar el cierre', () => {
      let modalAbierto = true;
      let productosSugeridos: ComboSuggestion['suggestedProducts'] | undefined;
      presenter.isComboModalOpen$.subscribe(val => modalAbierto = val);
      presenter.suggestedProducts$.subscribe(val => productosSugeridos = val);

      presenter.closeComboPromotionModal();

      expect(modalAbierto).toBeFalse();
      expect(productosSugeridos).toEqual([]);
    });
  });

  describe('Generación de Promoción', () => {
    it('debería crear la promoción en el servicio, notificar el éxito y redirigir al listado', () => {
      presenter.seleccionarProducto(SugerenciasMother.crearSugerencia());
      servicioProducto.getById.and.returnValue(of(SugerenciasMother.crearProducto()));
      servicioPromociones.createPromotion.and.returnValue(of({} as Promotion));
      const datosPromocion = {
        discountPercentage: 10,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
        productIds: ['c1']
      };
      let modalAbierto = true;
      presenter.isComboModalOpen$.subscribe(val => modalAbierto = val);

      presenter.generatePromotion(datosPromocion);

      expect(servicioPromociones.createPromotion).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'Combo Producto Base',
        discountPercentage: 10,
        productIds: ['p1', 'c1']
      }));
      expect(modalAbierto).toBeFalse();
      expect(toast.mostrar).toHaveBeenCalledWith('Combo creado exitosamente', 'success');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });

    it('debería notificar el error y redirigir al listado cuando el servicio de promociones falle', () => {
      presenter.seleccionarProducto(SugerenciasMother.crearSugerencia());
      servicioProducto.getById.and.returnValue(of(SugerenciasMother.crearProducto()));
      servicioPromociones.createPromotion.and.returnValue(throwError(() => new Error('API Error')));
      const datosPromocion = {
        discountPercentage: 10,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
        productIds: ['c1']
      };

      presenter.generatePromotion(datosPromocion);

      expect(toast.mostrar).toHaveBeenCalledWith('Error al crear el combo', 'error');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });
  });
});
