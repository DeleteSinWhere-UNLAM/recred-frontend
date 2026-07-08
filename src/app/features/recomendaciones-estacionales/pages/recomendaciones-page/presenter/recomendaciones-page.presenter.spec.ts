import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../../../../data-access/services/perfil.service';
import { Promotion, PromotionService } from '../../../../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { ProductoInventarioMother } from '../../../../inventario/inventario.mother';
import { ProductoService } from '../../../../inventario/services/producto.service';
import {
  BUFFET_ID_TEST,
  LAT_TEST,
  LNG_TEST,
  PromocionSugeridaMother,
  RecomendacionesResponseMother,
} from '../../../recomendaciones-estacionales.mother';
import { RecomendacionesService } from '../../../services/recomendaciones.service';
import { RecomendacionesPagePresenter } from './recomendaciones-page.presenter';

interface PresenterInterno {
  suggestedPromotionState: { set(v: unknown): void };
}

describe('RecomendacionesPagePresenter', () => {
  let presenter: RecomendacionesPagePresenter;
  let servicioRecomendaciones: jasmine.SpyObj<RecomendacionesService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let servicioPromotion: jasmine.SpyObj<PromotionService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let router: jasmine.SpyObj<Router>;

  function mockGeolocationOk(): void {
    const positionMock = {
      coords: { latitude: LAT_TEST, longitude: LNG_TEST },
    } as unknown as GeolocationPosition;

    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((success) => {
      (success as PositionCallback)(positionMock);
    });
  }

  function mockGeolocationError(): void {
    const errorMock = Object.create(GeolocationPositionError.prototype) as GeolocationPositionError;
    Object.defineProperty(errorMock, 'code', { value: 1 });
    Object.defineProperty(errorMock, 'message', { value: 'User denied Geolocation' });

    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((_, error) => {
      (error as PositionErrorCallback)(errorMock);
    });
  }

  beforeEach(() => {
    servicioRecomendaciones = jasmine.createSpyObj('RecomendacionesService', [
      'getSeasonalRecommendations',
    ]);
    servicioProducto = jasmine.createSpyObj('ProductoService', ['getById']);
    servicioPromotion = jasmine.createSpyObj('PromotionService', ['createPromotion']);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID_TEST);

    TestBed.configureTestingModule({
      providers: [
        RecomendacionesPagePresenter,
        { provide: RecomendacionesService, useValue: servicioRecomendaciones },
        { provide: ProductoService, useValue: servicioProducto },
        { provide: PromotionService, useValue: servicioPromotion },
        { provide: ToastService, useValue: servicioToast },
        { provide: Router, useValue: router },
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    });

    presenter = TestBed.inject(RecomendacionesPagePresenter);
  });

  describe('Estado inicial', () => {
    it('dado el presenter recien inyectado, los signals deberian arrancar en su valor por defecto', () => {
      expect(presenter.isLoading()).toBeFalse();
      expect(presenter.error()).toBeNull();
      expect(presenter.sugerencias()).toEqual([]);
      expect(presenter.tipPromocional()).toBeNull();
      expect(presenter.seasonInfo()).toBeNull();
      expect(presenter.suggestedPromotion()).toBeNull();
      expect(presenter.weatherInfo()).toBeNull();
      expect(presenter.showModal()).toBeFalse();
      expect(presenter.shouldShowPromotionModal()).toBeFalse();
    });
  });

  describe('loadRecommendations', () => {
    it('dado geolocation ok y una respuesta completa, deberia cargar sugerencias, tip, estacion, clima, promocion sugerida y resolvedProducts', () => {
      mockGeolocationOk();
      servicioRecomendaciones.getSeasonalRecommendations.and.returnValue(
        of(RecomendacionesResponseMother.crear()),
      );
      servicioProducto.getById.and.callFake((id: string) =>
        of(ProductoInventarioMother.crear({ id })),
      );

      presenter.loadRecommendations();

      expect(servicioRecomendaciones.getSeasonalRecommendations).toHaveBeenCalledWith(
        LAT_TEST,
        LNG_TEST,
      );
      expect(presenter.sugerencias().length).toBe(2);
      expect(presenter.tipPromocional()).toContain('invierno');
      expect(presenter.seasonInfo()?.estacion_actual).toBe('Invierno');
      expect(presenter.weatherInfo()?.temperature).toBe(12);
      expect(presenter.suggestedPromotion()).not.toBeNull();
      expect(presenter.resolvedProducts().length).toBe(2);
      expect(presenter.isLoading()).toBeFalse();
    });

    it('dado geolocation ok y respuesta sin promocion sugerida, resolvedProducts deberia quedar vacio', () => {
      mockGeolocationOk();
      servicioRecomendaciones.getSeasonalRecommendations.and.returnValue(
        of(RecomendacionesResponseMother.crearSinPromocion()),
      );

      presenter.loadRecommendations();

      expect(presenter.suggestedPromotion()).toBeNull();
      expect(presenter.resolvedProducts()).toEqual([]);
    });

    it('dado que getById de un producto falla, deberia devolver un stub "Producto no disponible"', () => {
      mockGeolocationOk();
      servicioRecomendaciones.getSeasonalRecommendations.and.returnValue(
        of(
          RecomendacionesResponseMother.crear({
            promocion_sugerida: PromocionSugeridaMother.crear({ productIds: ['prod-1'] }),
          }),
        ),
      );
      servicioProducto.getById.and.returnValue(throwError(() => new Error('boom')));

      presenter.loadRecommendations();

      expect(presenter.resolvedProducts().length).toBe(1);
      expect(presenter.resolvedProducts()[0].nombre).toBe('Producto no disponible');
    });

    it('dado geolocation denegada, deberia setear el mensaje de error de ubicacion', () => {
      mockGeolocationError();

      presenter.loadRecommendations();

      expect(presenter.error()).toContain('No pudimos acceder a tu ubicación');
      expect(presenter.isLoading()).toBeFalse();
    });

    it('dado geolocation no soportada, deberia setear el mensaje de error generico', () => {
      const original = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });

      try {
        presenter.loadRecommendations();

        expect(presenter.error()).toContain('motor de recomendaciones');
        expect(presenter.isLoading()).toBeFalse();
      } finally {
        Object.defineProperty(navigator, 'geolocation', { value: original, configurable: true });
      }
    });

    it('dado geolocation ok pero el service falla, deberia setear el mensaje de error generico', () => {
      mockGeolocationOk();
      servicioRecomendaciones.getSeasonalRecommendations.and.returnValue(
        throwError(() => new Error('boom')),
      );

      presenter.loadRecommendations();

      expect(presenter.error()).toContain('motor de recomendaciones');
    });
  });

  describe('abrirModalPromocion', () => {
    it('dado sin promocion sugerida, cuando llamo, no deberia abrir el modal', () => {
      presenter.abrirModalPromocion();

      expect(presenter.showModal()).toBeFalse();
      expect(presenter.shouldShowPromotionModal()).toBeFalse();
    });

    it('dado una promocion sugerida, cuando abro el modal, showModal y shouldShowPromotionModal deberian ser true', () => {
      givenPromocionSugerida();

      presenter.abrirModalPromocion();

      expect(presenter.showModal()).toBeTrue();
      expect(presenter.shouldShowPromotionModal()).toBeTrue();
    });
  });

  describe('closeModal', () => {
    it('dado el modal abierto, cuando cierro, showModal deberia ser false', () => {
      givenPromocionSugerida();
      presenter.abrirModalPromocion();

      presenter.closeModal();

      expect(presenter.showModal()).toBeFalse();
    });
  });

  describe('confirmPromotion', () => {
    const formData = {
      discountPercentage: 15,
      startDate: '2026-06-10',
      endDate: '2026-06-15',
      productIds: ['prod-1', 'prod-2'],
    };

    it('dado que la creacion sale ok, deberia mostrar toast success, cerrar el modal y navegar a /promociones', () => {
      servicioPromotion.createPromotion.and.returnValue(of({ id: 'promo-1' } as never as Promotion));
      givenPromocionSugerida({ nombre: 'Combo Frio' });

      presenter.confirmPromotion(formData);

      expect(servicioPromotion.createPromotion).toHaveBeenCalled();
      const payload = servicioPromotion.createPromotion.calls.mostRecent().args[0] as Record<string, unknown>;
      expect(payload['name']).toBe('Combo Frio');
      expect(payload['buffetId']).toBe(BUFFET_ID_TEST);
      expect(payload['discountPercentage']).toBe(15);
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Promoción creada exitosamente', 'success');
      expect(presenter.showModal()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });

    it('dado sin promocion sugerida cargada, deberia mandar el nombre por defecto "Promoción Estacional"', () => {
      servicioPromotion.createPromotion.and.returnValue(of({} as never as Promotion));

      presenter.confirmPromotion(formData);

      const payload = servicioPromotion.createPromotion.calls.mostRecent().args[0] as Record<string, unknown>;
      expect(payload['name']).toBe('Promoción Estacional');
    });

    it('dado que la creacion falla, deberia mostrar toast de error y navegar igual a /promociones', () => {
      servicioPromotion.createPromotion.and.returnValue(throwError(() => new Error('boom')));

      presenter.confirmPromotion(formData);

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al crear la promoción', 'error');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });
  });

  describe('volver', () => {
    it('dado el presenter, cuando llamo volver, deberia navegar a /kiosquero', () => {
      presenter.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  function givenPromocionSugerida(
    override: Partial<ReturnType<typeof PromocionSugeridaMother.crear>> = {},
  ): void {
    (presenter as unknown as PresenterInterno).suggestedPromotionState.set(
      PromocionSugeridaMother.crear(override),
    );
  }
});
