import { TestBed } from '@angular/core/testing';
import { SeasonalPagePresenter } from './seasonal-page.presenter';
import { RecomendacionesService } from '../../../services/recomendaciones.service';
import { ProductService } from '../../../../updated-inventory/services/product.service';
import { PromotionService } from '../../../../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { PerfilService } from '../../../../../data-access/services/perfil.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('SeasonalPagePresenter', () => {
  let presenter: SeasonalPagePresenter;
  let mockRecomendacionesService: jasmine.SpyObj<RecomendacionesService>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockPromotionService: jasmine.SpyObj<PromotionService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPerfilService: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    mockRecomendacionesService = jasmine.createSpyObj('RecomendacionesService', ['getSeasonalRecommendations']);
    mockProductService = jasmine.createSpyObj('ProductService', ['getById']);
    mockPromotionService = jasmine.createSpyObj('PromotionService', ['createPromotion']);
    mockToastService = jasmine.createSpyObj('ToastService', ['mostrar']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    mockPerfilService = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);

    mockPerfilService.obtenerBuffetId.and.returnValue('buffet-123');

    TestBed.configureTestingModule({
      providers: [
        SeasonalPagePresenter,
        { provide: RecomendacionesService, useValue: mockRecomendacionesService },
        { provide: ProductService, useValue: mockProductService },
        { provide: PromotionService, useValue: mockPromotionService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: PerfilService, useValue: mockPerfilService }
      ]
    });

    presenter = TestBed.inject(SeasonalPagePresenter);
  });

  it('Dado que se inicializa, los estados por defecto deben ser correctos', () => {
    expect(presenter.isLoading()).toBeFalse();
    expect(presenter.error()).toBeNull();
    expect(presenter.sugerencias()).toEqual([]);
    expect(presenter.seasonInfo()).toBeNull();
    expect(presenter.suggestedPromotion()).toBeNull();
    expect(presenter.showModal()).toBeFalse();
  });

  describe('abrirModalPromocion', () => {
    it('Dado que hay una promoción sugerida, cuando se llama a abrirModalPromocion, entonces debe abrir el modal', () => {
      (presenter as any).suggestedPromotionState.set({ nombre: 'Promo', descuento: 10, categorias_destino: [] } as any);
      presenter.abrirModalPromocion();
      expect(presenter.showModal()).toBeTrue();
    });

    it('Dado que NO hay promoción sugerida, cuando se llama a abrirModalPromocion, entonces no debe hacer nada', () => {
      presenter.abrirModalPromocion();
      expect(presenter.showModal()).toBeFalse();
    });
  });

  describe('volver', () => {
    it('Dado que se llama a volver, debe navegar a /kiosquero', () => {
      presenter.volver();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  describe('confirmPromotion', () => {
    it('Dado que la promoción se crea exitosamente, debe mostrar toast de éxito y cerrar el modal', () => {
      mockPromotionService.createPromotion.and.returnValue(of({} as any));
      (presenter as any).suggestedPromotionState.set({ nombre: 'Promo Fria', descuento: 10, categorias_destino: [] });
      
      const formData = {
        discountPercentage: 15,
        startDate: '2026-06-10T00:00:00Z',
        endDate: '2026-06-15T00:00:00Z',
        productIds: ['prod1', 'prod2']
      };

      presenter.confirmPromotion(formData);

      expect(mockPromotionService.createPromotion).toHaveBeenCalled();
      expect(mockToastService.mostrar).toHaveBeenCalledWith('Promoción creada exitosamente', 'success');
      expect(presenter.showModal()).toBeFalse();
    });

    it('Dado que falla al crear, debe mostrar toast de error', () => {
      mockPromotionService.createPromotion.and.returnValue(throwError(() => new Error('error')));
      (presenter as any).suggestedPromotionState.set({ nombre: 'Promo Fria', descuento: 10, categorias_destino: [] });
      
      const formData = {
        discountPercentage: 15,
        startDate: '2026-06-10T00:00:00Z',
        endDate: '2026-06-15T00:00:00Z',
        productIds: ['prod1', 'prod2']
      };

      presenter.confirmPromotion(formData);

      expect(mockToastService.mostrar).toHaveBeenCalledWith('Error al crear la promoción', 'error');
    });
  });
});
