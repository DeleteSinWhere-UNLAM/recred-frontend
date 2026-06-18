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
    mockPromotionService = jasmine.createSpyObj('PromotionService', ['approvePromotion', 'discardPromotion']);
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
    expect(presenter.showModal()).toBeFalse();
  });

  describe('volver', () => {
    it('Dado que se llama a volver, debe navegar a /kiosquero', () => {
      presenter.volver();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  describe('approvePromotion', () => {
    it('Dado que la promoción se aprueba exitosamente, debe mostrar toast de éxito y cerrar el modal', () => {
      mockPromotionService.approvePromotion.and.returnValue(of({} as import('../../../../../data-access/services/promociones/promotion.service').Promotion));
      presenter.approvePromotion('1');
      expect(mockPromotionService.approvePromotion).toHaveBeenCalledWith('1', 'buffet-123');
      expect(mockToastService.mostrar).toHaveBeenCalledWith('Promoción aprobada exitosamente', 'success');
      expect(presenter.showModal()).toBeFalse();
    });

    it('Dado que falla al aprobar, debe mostrar toast de error', () => {
      mockPromotionService.approvePromotion.and.returnValue(throwError(() => new Error('error')));
      presenter.approvePromotion('1');
      expect(mockToastService.mostrar).toHaveBeenCalledWith('Error al aprobar la promoción', 'error');
    });
  });

  describe('discardPromotion', () => {
    it('Dado que la promoción se descarta, debe mostrar toast y cerrar modal', () => {
      mockPromotionService.discardPromotion.and.returnValue(of(undefined));
      presenter.discardPromotion('1');
      expect(mockPromotionService.discardPromotion).toHaveBeenCalledWith('1');
      expect(mockToastService.mostrar).toHaveBeenCalledWith('Promoción descartada', 'success');
      expect(presenter.showModal()).toBeFalse();
    });
  });

  describe('editPromotion', () => {
    it('Dado que se edita, debe navegar a /promociones/editar/id', () => {
      presenter.editPromotion('1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/promociones/editar', '1']);
      expect(presenter.showModal()).toBeFalse();
    });
  });
});
