import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SugerenciasPresenter } from './sugerencias.presenter';
import { SugerenciasService } from '../services/sugerencias.service';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { SugerenciaProducto, ComboSuggestion } from '../models/sugerencia-producto.model';
import { Promotion } from '../../../data-access/services/promociones/promotion.service';
import { SugerenciasMother } from '../sugerencias.mother';



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

    TestBed.configureTestingModule({
      providers: [
        SugerenciasPresenter,
        { provide: SugerenciasService, useValue: servicioSugerencias },
        { provide: PromotionService, useValue: servicioPromociones },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        { provide: ProductoService, useValue: servicioProducto }
      ]
    });

    presenter = TestBed.inject(SugerenciasPresenter);
  });

  describe('Inicialización', () => {
    it('debería solicitar las sugerencias al servicio y seleccionar el primer producto automáticamente', () => {
      let sugerenciaActiva: SugerenciaProducto | undefined;
      let sugerenciasEmitidas: SugerenciaProducto[] = [];
      const sugerencias = SugerenciasMother.crearSugerencias();
      presenter.sugerenciaSeleccionada$.subscribe(val => sugerenciaActiva = val);
      
      givenSugerenciasExisten(sugerencias);
      whenSeInicializaElPresenter(sugerenciasEmitidas, () => {});
      thenLosValoresCalculadosSonCorrectos(sugerencias, sugerenciaActiva, sugerenciasEmitidas);
    });

    it('no debería seleccionar ningún producto ni fallar cuando el servicio retorna una lista vacía', () => {
      let sugerenciaActiva: SugerenciaProducto | undefined;
      presenter.sugerenciaSeleccionada$.subscribe(val => sugerenciaActiva = val);
      
      givenSugerenciasVacias();
      whenSeInicializaElPresenter([], () => {});
      thenLosValoresCalculadosSonNulos(sugerenciaActiva);
    });
  });

  describe('Modal de Promociones de Combos', () => {
    it('debería cargar sugerencias de combo y abrir el modal cuando hay un producto activo', () => {
      let modalAbierto = false;
      presenter.isComboModalOpen$.subscribe(val => modalAbierto = val);
      
      givenProductoActivoSeleccionado();
      givenSugerenciaComboExiste();
      whenAbroModalCombo(() => {});
      thenSeLlamaAlServicioDeCombos(modalAbierto);
    });

    it('no debería ejecutar ninguna acción al solicitar abrir el modal sin un producto activo', () => {
      let modalAbierto = false;
      presenter.isComboModalOpen$.subscribe(val => modalAbierto = val);
      
      givenNingunProductoSeleccionado();
      whenAbroModalCombo(() => {});
      thenNoSeLlamaAlServicioDeCombos(modalAbierto);
    });

    it('debería cerrar el modal y vaciar los productos sugeridos al solicitar el cierre', () => {
      let modalAbierto = true;
      let productosSugeridos: ComboSuggestion['suggestedProducts'] | undefined;
      presenter.isComboModalOpen$.subscribe(val => modalAbierto = val);
      presenter.suggestedProducts$.subscribe(val => productosSugeridos = val);
      
      givenModalAbiertoConProductos();
      whenCierroModal(() => {});
      thenModalEstaCerradoYSinProductos(modalAbierto, productosSugeridos);
    });
  });

  describe('Generación de Promoción', () => {
    it('debería crear la promoción en el servicio, notificar el éxito y redirigir al listado', () => {
      let modalAbierto = true;
      presenter.isComboModalOpen$.subscribe(val => modalAbierto = val);
      const datosPromocion = {
        discountPercentage: 10,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
        productIds: ['c1']
      };

      givenPreparacionGenerarPromocionExitosa();
      whenGeneroPromocion(datosPromocion, () => {});
      thenPromocionFueCreadaConExito(modalAbierto);
    });

    it('debería notificar el error y redirigir al listado cuando el servicio de promociones falle', () => {
      const datosPromocion = {
        discountPercentage: 10,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
        productIds: ['c1']
      };

      givenPreparacionGenerarPromocionFallida();
      whenGeneroPromocion(datosPromocion, () => {});
      thenApareceNotificacionDeError();
    });
  });

  function givenSugerenciasExisten(sugerencias: SugerenciaProducto[]): void {
    servicioSugerencias.getSugerencias.and.returnValue(of(sugerencias));
  }

  function givenSugerenciasVacias(): void {
    servicioSugerencias.getSugerencias.and.returnValue(of([]));
  }

  function givenProductoActivoSeleccionado(): void {
    presenter.seleccionarProducto(SugerenciasMother.crearSugerencia());
  }

  function givenSugerenciaComboExiste(): void {
    servicioSugerencias.getComboSuggestions.and.returnValue(of(SugerenciasMother.crearComboSuggestion()));
  }

  function givenNingunProductoSeleccionado(): void {
  }

  function givenModalAbiertoConProductos(): void {
    presenter.openComboPromotionModal();
  }

  function givenPreparacionGenerarPromocionExitosa(): void {
    presenter.seleccionarProducto(SugerenciasMother.crearSugerencia());
    servicioProducto.getById.and.returnValue(of(SugerenciasMother.crearProducto()));
    servicioPromociones.createPromotion.and.returnValue(of({} as Promotion));
  }

  function givenPreparacionGenerarPromocionFallida(): void {
    presenter.seleccionarProducto(SugerenciasMother.crearSugerencia());
    servicioProducto.getById.and.returnValue(of(SugerenciasMother.crearProducto()));
    servicioPromociones.createPromotion.and.returnValue(throwError(() => new Error('API Error')));
  }

  function whenSeInicializaElPresenter(arrayResult: SugerenciaProducto[], callback: () => void): void {
    presenter.sugerencias$.subscribe(val => arrayResult.push(...val));
    presenter.initialize('user-1');
    callback();
  }

  function whenAbroModalCombo(callback: () => void): void {
    presenter.openComboPromotionModal();
    callback();
  }

  function whenCierroModal(callback: () => void): void {
    presenter.closeComboPromotionModal();
    callback();
  }

  function whenGeneroPromocion(datos: any, callback: () => void): void {
    presenter.generatePromotion(datos);
    callback();
  }

  function thenLosValoresCalculadosSonCorrectos(sugerencias: SugerenciaProducto[], activa: SugerenciaProducto | undefined, emitidas: SugerenciaProducto[]): void {
    expect(servicioSugerencias.getSugerencias).toHaveBeenCalled();
    expect(emitidas).toEqual(sugerencias);
    expect(activa).toEqual(sugerencias[0]);
    expect(presenter.totalProductosAnalizados).toBe(2);
    expect(presenter.totalStockInmovilizado).toBe(30);
    expect(presenter.promedioDiasSinVenta).toBe(8);
    expect(presenter.productoMasCritico?.productoOriginal).toBe('Producto 2');
  }

  function thenLosValoresCalculadosSonNulos(activa: SugerenciaProducto | undefined): void {
    expect(activa).toBeUndefined();
    expect(presenter.totalProductosAnalizados).toBe(0);
    expect(presenter.totalStockInmovilizado).toBe(0);
    expect(presenter.promedioDiasSinVenta).toBe(0);
  }

  function thenSeLlamaAlServicioDeCombos(modalAbierto: boolean): void {
    expect(servicioSugerencias.getComboSuggestions).toHaveBeenCalledWith('p1');
    expect(modalAbierto).toBeTrue();
  }

  function thenNoSeLlamaAlServicioDeCombos(modalAbierto: boolean): void {
    expect(servicioSugerencias.getComboSuggestions).not.toHaveBeenCalled();
    expect(modalAbierto).toBeFalse();
  }

  function thenModalEstaCerradoYSinProductos(modalAbierto: boolean, productos: any): void {
    expect(modalAbierto).toBeFalse();
    expect(productos).toEqual([]);
  }

  function thenPromocionFueCreadaConExito(modalAbierto: boolean): void {
    expect(servicioPromociones.createPromotion).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'Combo Producto Base',
      discountPercentage: 10,
      productIds: ['p1', 'c1']
    }));
    expect(modalAbierto).toBeFalse();
    expect(toast.mostrar).toHaveBeenCalledWith('Combo creado exitosamente', 'success');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
  }

  function thenApareceNotificacionDeError(): void {
    expect(toast.mostrar).toHaveBeenCalledWith('Error al crear el combo', 'error');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
  }
});
