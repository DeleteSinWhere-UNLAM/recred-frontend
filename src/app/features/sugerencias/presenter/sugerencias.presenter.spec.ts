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
import { UsuarioService } from '../../../data-access/services/usuario.service';



describe('SugerenciasPresenter', () => {
  let presenter: SugerenciasPresenter;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasService>;
  let servicioPromociones: jasmine.SpyObj<PromotionService>;
  let router: jasmine.SpyObj<Router>;
  let toast: jasmine.SpyObj<ToastService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(() => {
    servicioSugerencias = jasmine.createSpyObj('SugerenciasService', ['getSugerencias', 'getComboSuggestions']);
    servicioPromociones = jasmine.createSpyObj('PromotionService', ['createPromotion']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioProducto = jasmine.createSpyObj('ProductoService', ['getById']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);

    TestBed.configureTestingModule({
      providers: [
        SugerenciasPresenter,
        { provide: SugerenciasService, useValue: servicioSugerencias },
        { provide: PromotionService, useValue: servicioPromociones },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        { provide: ProductoService, useValue: servicioProducto },
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    });

    presenter = TestBed.inject(SugerenciasPresenter);
  });

  describe('Inicialización', () => {
    it('debería solicitar las sugerencias al servicio y seleccionar el primer producto automáticamente', () => {
      const usuario = SugerenciasMother.crearUsuario();
      servicioUsuario.getUsuarioActual.and.returnValue(usuario);
      const sugerencias = SugerenciasMother.crearSugerencias();
      servicioSugerencias.getSugerencias.and.returnValue(of(sugerencias));
      let sugerenciaActiva: SugerenciaProducto | undefined;
      let sugerenciasEmitidas: SugerenciaProducto[] = [];
      presenter.sugerencias$.subscribe(val => sugerenciasEmitidas = val);
      presenter.sugerenciaSeleccionada$.subscribe(val => sugerenciaActiva = val);

      presenter.initialize();

      expect(servicioSugerencias.getSugerencias).toHaveBeenCalled();
      expect(sugerenciasEmitidas).toEqual(sugerencias);
      expect(sugerenciaActiva).toEqual(sugerencias[0]);
      expect(presenter.totalProductosAnalizados).toBe(2);
      expect(presenter.totalStockInmovilizado).toBe(30);
      expect(presenter.promedioDiasSinVenta).toBe(8);
      expect(presenter.productoMasCritico?.productoOriginal).toBe('Producto 2');
    });

    it('debería inicializar sin emitir datos si la respuesta de sugerencias está vacía', () => {
      const usuario = SugerenciasMother.crearUsuario();
      servicioUsuario.getUsuarioActual.and.returnValue(usuario);
      servicioSugerencias.getSugerencias.and.returnValue(of([]));
      let sugerenciaActiva: SugerenciaProducto | undefined;
      presenter.sugerenciaSeleccionada$.subscribe(val => sugerenciaActiva = val);

      presenter.initialize();

      expect(sugerenciaActiva).toBeUndefined();
      expect(presenter.totalProductosAnalizados).toBe(0);
      expect(presenter.totalStockInmovilizado).toBe(0);
      expect(presenter.promedioDiasSinVenta).toBe(0);
    });
  });

  describe('Modal de Combo de Promoción', () => {
    beforeEach(() => {
      const usuario = SugerenciasMother.crearUsuario();
      servicioUsuario.getUsuarioActual.and.returnValue(usuario);
      servicioSugerencias.getSugerencias.and.returnValue(of(SugerenciasMother.crearSugerencias()));
      presenter.initialize();
    });
    
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
      presenter.seleccionarProducto(undefined as unknown as SugerenciaProducto);
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
