import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RecomendacionesEstacionalesPresenter } from './recomendaciones-estacionales.presenter';
import { RecomendacionesService } from '../services/recomendaciones.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('RecomendacionesEstacionalesPresenter', () => {
  let presenter: RecomendacionesEstacionalesPresenter;
  let recomendacionesServiceSpy: jasmine.SpyObj<RecomendacionesService>;
  let productServiceSpy: jasmine.SpyObj<ProductoService>;
  let promotionServiceSpy: jasmine.SpyObj<PromotionService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    recomendacionesServiceSpy = jasmine.createSpyObj('RecomendacionesService', ['getSeasonalRecommendations']);
    productServiceSpy = jasmine.createSpyObj('ProductoService', ['getById']);
    promotionServiceSpy = jasmine.createSpyObj('PromotionService', ['approvePromotion', 'discardPromotion']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['mostrar']);
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);

    TestBed.configureTestingModule({
      providers: [
        RecomendacionesEstacionalesPresenter,
        { provide: RecomendacionesService, useValue: recomendacionesServiceSpy },
        { provide: ProductoService, useValue: productServiceSpy },
        { provide: PromotionService, useValue: promotionServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    presenter = TestBed.inject(RecomendacionesEstacionalesPresenter);
  });

  it('dado que se llama a volver, deberia navegar a kiosquero', () => {
    presenter.volver();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });

  describe('loadRecommendations', () => {
    beforeEach(() => {
      spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((success) => {
        success({ coords: { latitude: 10, longitude: 20 } } as GeolocationPosition);
      });
    });

    it('dado que loadRecommendations es exitoso sin promocion_creada, deberia setear sugerencias', fakeAsync(() => {
      recomendacionesServiceSpy.getSeasonalRecommendations.and.returnValue(of({
        sugerencias: [{ categoria: 'A', accion: 'A', motivo: 'M' }],
        tip_promocional: 'Tip'
      }));

      presenter.loadRecommendations();
      tick();

      expect(presenter.sugerencias().length).toBe(1);
      expect(presenter.tipPromocional()).toBe('Tip');
      expect(presenter.isLoading()).toBeFalse();
    }));

    it('dado que loadRecommendations tiene promo y resuelve productos exitosamente, abre el modal', fakeAsync(() => {
      recomendacionesServiceSpy.getSeasonalRecommendations.and.returnValue(of({
        sugerencias: [],
        promocion_creada: { id: 'promo1', name: 'P', discountPercentage: 10, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T00:00:00.000Z', productIds: ['prod1'], status: 'ACTIVE' }
      }));
      productServiceSpy.getById.and.returnValue(of({ id: 'prod1', nombre: 'Test', descripcion: '', precio: 1, peso: 1, stockActual: 1, categoriaId: '1', requierePreparacion: false }));

      presenter.loadRecommendations();
      tick();

      expect(presenter.promotion()).not.toBeNull();
      expect(presenter.resolvedProducts().length).toBe(1);
      expect(presenter.showModal()).toBeTrue();
      expect(presenter.shouldShowPromotionModal()).toBeTrue();
    }));

    it('dado que resolveProducts falla para un producto, deberia crear producto dummy no disponible', fakeAsync(() => {
      recomendacionesServiceSpy.getSeasonalRecommendations.and.returnValue(of({
        sugerencias: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        promocion_creada: { id: 'promo1', name: 'P', productIds: ['prod-err'] } as any
      }));
      productServiceSpy.getById.and.returnValue(throwError(() => new Error('Error')));

      presenter.loadRecommendations();
      tick();

      expect(presenter.resolvedProducts().length).toBe(1);
      expect(presenter.resolvedProducts()[0].nombre).toBe('Producto no disponible');
    }));

    it('dado que getCurrentPosition devuelve un error de geolocalizacion, muestra error especifico', fakeAsync(() => {
      (navigator.geolocation.getCurrentPosition as jasmine.Spy).and.callFake((success, error) => {
        const err = new Error('Geoloc') as unknown;
        Object.setPrototypeOf(err, GeolocationPositionError.prototype);
        error(err);
      });

      presenter.loadRecommendations();
      tick();

      expect(presenter.error()).toContain('No pudimos acceder a tu ubicación');
      expect(presenter.isLoading()).toBeFalse();
    }));

    it('dado que backend devuelve error generico, muestra error de conexion', fakeAsync(() => {
      recomendacionesServiceSpy.getSeasonalRecommendations.and.returnValue(throwError(() => new Error('Net error')));

      presenter.loadRecommendations();
      tick();

      expect(presenter.error()).toContain('Ocurrió un error al conectar con el motor');
      expect(presenter.isLoading()).toBeFalse();
    }));
  });

  describe('Promotions actions', () => {
    it('dado que se aprueba promocion exitosamente, deberia emitir success y cerrar modal', () => {
      perfilServiceSpy.obtenerBuffetId.and.returnValue('buffet1');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      promotionServiceSpy.approvePromotion.and.returnValue(of({} as any));
      presenter['showModalState'].set(true);

      presenter.approvePromotion('promo1');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Promoción aprobada exitosamente', 'success');
      expect(presenter.showModal()).toBeFalse();
    });

    it('dado que se aprueba promocion con error, deberia mostrar toast error', () => {
      perfilServiceSpy.obtenerBuffetId.and.returnValue('buffet1');
      promotionServiceSpy.approvePromotion.and.returnValue(throwError(() => new Error()));

      presenter.approvePromotion('promo1');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al aprobar la promoción', 'error');
    });

    it('dado que se descarta promocion exitosamente, deberia emitir success y cerrar modal', () => {
      promotionServiceSpy.discardPromotion.and.returnValue(of(void 0));
      presenter['showModalState'].set(true);

      presenter.discardPromotion('promo1');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Promoción descartada', 'success');
      expect(presenter.showModal()).toBeFalse();
    });

    it('dado que se descarta promocion con error, deberia mostrar toast error', () => {
      promotionServiceSpy.discardPromotion.and.returnValue(throwError(() => new Error()));

      presenter.discardPromotion('promo1');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al descartar la promoción', 'error');
    });

    it('dado que se edita promocion, deberia cerrar modal y navegar a editar', () => {
      presenter['showModalState'].set(true);
      presenter.editPromotion('promo1');

      expect(presenter.showModal()).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/promociones/editar', 'promo1']);
    });
  });
});
