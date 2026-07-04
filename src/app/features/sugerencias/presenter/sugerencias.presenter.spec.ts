import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PromotionService, Promotion } from '../../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { SugerenciasService } from '../services/sugerencias.service';
import {
  ComboSuggestionMother,
  ProductoMother,
  SugerenciaProductoMother,
} from '../sugerencias.mother';
import { SugerenciasPresenter } from './sugerencias.presenter';

describe('SugerenciasPresenter', () => {
  let presenter: SugerenciasPresenter;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasService>;
  let servicioPromociones: jasmine.SpyObj<PromotionService>;
  let router: jasmine.SpyObj<Router>;
  let toast: jasmine.SpyObj<ToastService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;

  beforeEach(() => {
    servicioSugerencias = jasmine.createSpyObj<SugerenciasService>('SugerenciasService', [
      'getSugerencias',
      'getComboSuggestions',
    ]);
    servicioPromociones = jasmine.createSpyObj<PromotionService>('PromotionService', [
      'createPromotion',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    servicioProducto = jasmine.createSpyObj<ProductoService>('ProductoService', ['getById']);

    TestBed.configureTestingModule({
      providers: [
        SugerenciasPresenter,
        { provide: SugerenciasService, useValue: servicioSugerencias },
        { provide: PromotionService, useValue: servicioPromociones },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        { provide: ProductoService, useValue: servicioProducto },
      ],
    });

    presenter = TestBed.inject(SugerenciasPresenter);
  });

  describe('initialize', () => {
    it('dadas dos sugerencias del back, cuando inicializo, deberia emitirlas y seleccionar la primera', async () => {
      const sugerencias = SugerenciaProductoMother.crearVarias();
      servicioSugerencias.getSugerencias.and.returnValue(of(sugerencias));

      presenter.initialize('user-1');

      expect(servicioSugerencias.getSugerencias).toHaveBeenCalled();
      expect(await firstValueFrom(presenter.sugerencias$)).toEqual(sugerencias);
      expect(await firstValueFrom(presenter.sugerenciaSeleccionada$)).toEqual(sugerencias[0]);
      expect(presenter.totalProductosAnalizados).toBe(2);
      expect(presenter.totalStockInmovilizado).toBe(30);
      expect(presenter.promedioDiasSinVenta).toBe(8);
      expect(presenter.productoMasCritico?.productoOriginal).toBe('Producto 2');
    });

    it('dada una lista vacia del back, cuando inicializo, no deberia seleccionar ningun producto', async () => {
      servicioSugerencias.getSugerencias.and.returnValue(of([]));

      presenter.initialize('user-1');

      expect(await firstValueFrom(presenter.sugerenciaSeleccionada$)).toBeUndefined();
      expect(presenter.totalProductosAnalizados).toBe(0);
      expect(presenter.totalStockInmovilizado).toBe(0);
      expect(presenter.promedioDiasSinVenta).toBe(0);
    });
  });

  describe('openComboPromotionModal', () => {
    it('dada una sugerencia seleccionada, cuando abro el modal, deberia pedir combos y abrirlo', async () => {
      presenter.seleccionarProducto(SugerenciaProductoMother.crear());
      servicioSugerencias.getComboSuggestions.and.returnValue(of(ComboSuggestionMother.crear()));

      presenter.openComboPromotionModal();

      expect(servicioSugerencias.getComboSuggestions).toHaveBeenCalledWith('p1');
      expect(await firstValueFrom(presenter.isComboModalOpen$)).toBeTrue();
    });

    it('dado que no hay sugerencia seleccionada, cuando abro el modal, no deberia hacer nada', async () => {
      presenter.openComboPromotionModal();

      expect(servicioSugerencias.getComboSuggestions).not.toHaveBeenCalled();
      expect(await firstValueFrom(presenter.isComboModalOpen$)).toBeFalse();
    });
  });

  describe('closeComboPromotionModal', () => {
    it('cuando cierro el modal, deberia limpiar la lista de productos sugeridos', async () => {
      presenter.closeComboPromotionModal();

      expect(await firstValueFrom(presenter.isComboModalOpen$)).toBeFalse();
      expect(await firstValueFrom(presenter.suggestedProducts$)).toEqual([]);
    });
  });

  describe('generatePromotion', () => {
    const datosPromocion = {
      discountPercentage: 10,
      startDate: '2026-06-16',
      endDate: '2026-06-20',
      productIds: ['c1'],
    };

    it('dada una promocion valida, cuando genero, deberia crearla, notificar y redirigir a /promociones', async () => {
      presenter.seleccionarProducto(SugerenciaProductoMother.crear());
      servicioProducto.getById.and.returnValue(of(ProductoMother.crear()));
      servicioPromociones.createPromotion.and.returnValue(of({} as Promotion));

      presenter.generatePromotion(datosPromocion);

      expect(servicioPromociones.createPromotion).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'Combo Producto Base',
          discountPercentage: 10,
          productIds: ['p1', 'c1'],
        }),
      );
      expect(await firstValueFrom(presenter.isComboModalOpen$)).toBeFalse();
      expect(toast.mostrar).toHaveBeenCalledWith('Combo creado exitosamente', 'success');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });

    it('dado que falla el service de promociones, cuando genero, deberia notificar el error y redirigir igual', () => {
      presenter.seleccionarProducto(SugerenciaProductoMother.crear());
      servicioProducto.getById.and.returnValue(of(ProductoMother.crear()));
      servicioPromociones.createPromotion.and.returnValue(throwError(() => new Error('API Error')));

      presenter.generatePromotion(datosPromocion);

      expect(toast.mostrar).toHaveBeenCalledWith('Error al crear el combo', 'error');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });
  });

  describe('graficos', () => {
    it('dadas dos sugerencias, cuando pido chartDiasSinVenta, deberia ordenar por dias descendente con porcentajes', () => {
      servicioSugerencias.getSugerencias.and.returnValue(of(SugerenciaProductoMother.crearVarias()));
      presenter.initialize('user-1');

      const chart = presenter.chartDiasSinVenta;

      expect(chart[0].nombre).toBe('Producto 2');
      expect(chart[0].dias).toBe(10);
      expect(chart[0].percent).toBe(100);
      expect(chart[1].nombre).toBe('Producto 1');
      expect(chart[1].percent).toBe(50);
    });

    it('dadas dos sugerencias, cuando pido chartStockVsVentas, deberia calcular porcentajes relativos al maximo', () => {
      servicioSugerencias.getSugerencias.and.returnValue(of(SugerenciaProductoMother.crearVarias()));
      presenter.initialize('user-1');

      const chart = presenter.chartStockVsVentas;

      expect(chart.length).toBe(2);
      expect(chart[1].stockPercent).toBe(100);
      expect(chart[1].ventasPercent).toBe(100);
      expect(chart[0].stockPercent).toBe(50);
      expect(chart[0].ventasPercent).toBe(50);
    });

    it('dada una lista vacia, cuando pido los graficos, deberia devolver arrays vacios', () => {
      servicioSugerencias.getSugerencias.and.returnValue(of([]));
      presenter.initialize('user-1');

      expect(presenter.chartDiasSinVenta).toEqual([]);
      expect(presenter.chartStockVsVentas).toEqual([]);
    });
  });
});
