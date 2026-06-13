import { TestBed } from '@angular/core/testing';
import { PromocionesPagePresenter } from './promociones.presenter';
import { PromotionService, Promotion } from '../../../data-access/services/promociones/promotion.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('PromocionesPagePresenter', () => {
  let presenter: PromocionesPagePresenter;
  let mockPromotionService: jasmine.SpyObj<PromotionService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockPromotionService = jasmine.createSpyObj('PromotionService', ['getPromotions', 'discardPromotion']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        PromocionesPagePresenter,
        { provide: PromotionService, useValue: mockPromotionService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    presenter = TestBed.inject(PromocionesPagePresenter);
  });

  it('Dado que se inicializa el presenter, debería estar en un estado limpio', () => {
    expect(presenter.isLoading()).toBeFalse();
    expect(presenter.error()).toBeNull();
    expect(presenter.promotions()).toEqual([]);
  });

  it('Dado que se solicitan las promociones y la API responde correctamente, debería actualizar el estado', () => {
    const mockPromotions: Promotion[] = [
      { id: '1', name: 'Promo 1', discountPercentage: 10, productIds: ['p1'], startDate: '2026-06-12T00:00:00Z', endDate: '2026-06-20T00:00:00Z', status: 'ACTIVE' }
    ];
    mockPromotionService.getPromotions.and.returnValue(of(mockPromotions));

    presenter.loadPromotions();

    expect(presenter.isLoading()).toBeFalse();
    expect(presenter.error()).toBeNull();
    expect(presenter.promotions().length).toBe(1);
    expect(presenter.promotions()[0].name).toBe('Promo 1');
  });

  it('Dado que el backend devuelve nombres en español o snake_case, debería normalizarlos correctamente', () => {
    const mockRawPromotions: Record<string, unknown>[] = [
      { id: '1', nombre: 'Promo Spanish', porcentaje_descuento: 15, productosIds: ['p1'], fechaInicio: '2026-06-12T00:00:00.123456Z', fechaFin: '2026-06-20T00:00:00.654321Z', estado: 'DRAFT' }
    ];
    mockPromotionService.getPromotions.and.returnValue(of(mockRawPromotions as unknown as Promotion[]));

    presenter.loadPromotions();

    const result = presenter.promotions()[0];
    expect(result.name).toBe('Promo Spanish');
    expect(result.discountPercentage).toBe(15);
    expect(result.productIds).toEqual(['p1']);
    expect(result.status).toBe('DRAFT');
    expect(result.startDate).toContain('2026-06-12T00:00:00Z');
  });

  it('Dado que la API falla al obtener promociones, debería mostrar un mensaje de error', () => {
    mockPromotionService.getPromotions.and.returnValue(throwError(() => new Error('API Error')));

    presenter.loadPromotions();

    expect(presenter.isLoading()).toBeFalse();
    expect(presenter.error()).toBe('Ocurrió un error al cargar las promociones. Por favor, intenta nuevamente.');
    expect(presenter.promotions().length).toBe(0);
  });

  it('Dado que el usuario hace clic en volver, debería navegar a kiosquero', () => {
    presenter.volver();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });
});
