import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PromotionService, Promotion } from '../../../data-access/services/promociones/promotion.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { Product } from '../../updated-inventory/models/product.interface';
import { ProductService } from '../../updated-inventory/services/product.service';
import { PromocionesPagePresenter } from './promociones.presenter';

describe('PromocionesPagePresenter', () => {
  let presenter: PromocionesPagePresenter;
  let mockPromotionService: jasmine.SpyObj<PromotionService>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialogService: jasmine.SpyObj<DialogService>;

  beforeEach(() => {
    mockPromotionService = jasmine.createSpyObj('PromotionService', ['getPromotions', 'discardPromotion']);
    mockProductService = jasmine.createSpyObj('ProductService', ['getById']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockDialogService = jasmine.createSpyObj('DialogService', ['confirm']);

    TestBed.configureTestingModule({
      providers: [
        PromocionesPagePresenter,
        { provide: PromotionService, useValue: mockPromotionService },
        { provide: ProductService, useValue: mockProductService },
        { provide: Router, useValue: mockRouter },
        { provide: DialogService, useValue: mockDialogService }
      ]
    });

    presenter = TestBed.inject(PromocionesPagePresenter);
  });

  it('Dado que se inicializa el presenter, deberia estar en un estado limpio', () => {
    expect(presenter.isLoading()).toBeFalse();
    expect(presenter.error()).toBeNull();
    expect(presenter.promotions()).toEqual([]);
  });

  it('Dado que se solicitan las promociones y la API responde correctamente, deberia actualizar el estado con productos', () => {
    const mockPromotions: Promotion[] = [
      { id: '1', name: 'Promo 1', discountPercentage: 10, productIds: ['p1'], startDate: '2026-06-12T00:00:00Z', endDate: '2026-06-20T00:00:00Z', status: 'ACTIVE' }
    ];
    const mockProduct = createProduct('p1', 'Alfajor', 1200);
    mockPromotionService.getPromotions.and.returnValue(of(mockPromotions));
    mockProductService.getById.and.returnValue(of(mockProduct));

    presenter.loadPromotions();

    expect(presenter.isLoading()).toBeFalse();
    expect(presenter.error()).toBeNull();
    expect(presenter.promotions().length).toBe(1);
    expect(presenter.promotions()[0].name).toBe('Promo 1');
    expect(presenter.promotions()[0].products).toEqual([mockProduct]);
    expect(mockProductService.getById).toHaveBeenCalledWith('p1');
  });

  it('Dado que el backend devuelve nombres en espanol o snake_case, deberia normalizarlos correctamente', () => {
    const mockRawPromotions: Record<string, unknown>[] = [
      { id: '1', nombre: 'Promo Spanish', porcentaje_descuento: 15, productosIds: ['p1'], fechaInicio: '2026-06-12T00:00:00.123456Z', fechaFin: '2026-06-20T00:00:00.654321Z', estado: 'DRAFT' }
    ];
    mockPromotionService.getPromotions.and.returnValue(of(mockRawPromotions as unknown as Promotion[]));
    mockProductService.getById.and.returnValue(of(createProduct('p1', 'Jugo', 900)));

    presenter.loadPromotions();

    const result = presenter.promotions()[0];
    expect(result.name).toBe('Promo Spanish');
    expect(result.discountPercentage).toBe(15);
    expect(result.productIds).toEqual(['p1']);
    expect(result.status).toBe('DRAFT');
    expect(result.startDate).toContain('2026-06-12T00:00:00Z');
    expect(result.products[0].nombre).toBe('Jugo');
  });

  it('Dado que un producto de la promocion no se puede resolver, deberia usar un fallback', () => {
    const mockPromotions: Promotion[] = [
      { id: '1', name: 'Promo 1', discountPercentage: 10, productIds: ['p1'], startDate: '2026-06-12T00:00:00Z', endDate: '2026-06-20T00:00:00Z', status: 'ACTIVE' }
    ];
    mockPromotionService.getPromotions.and.returnValue(of(mockPromotions));
    mockProductService.getById.and.returnValue(throwError(() => new Error('Not found')));

    presenter.loadPromotions();

    expect(presenter.error()).toBeNull();
    expect(presenter.promotions()[0].products[0].id).toBe('p1');
    expect(presenter.promotions()[0].products[0].nombre).toBe('Producto no disponible');
  });

  it('Dado que la API falla al obtener promociones, deberia mostrar un mensaje de error', () => {
    mockPromotionService.getPromotions.and.returnValue(throwError(() => new Error('API Error')));

    presenter.loadPromotions();

    expect(presenter.isLoading()).toBeFalse();
    expect(presenter.error()).toBe('Ocurrió un error al cargar las promociones. Por favor, intenta nuevamente.');
    expect(presenter.promotions().length).toBe(0);
  });

  it('Dado que el usuario hace clic en volver, deberia navegar a kiosquero', () => {
    presenter.volver();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });
});

function createProduct(id: string, nombre: string, precio: number): Product {
  return {
    id,
    nombre,
    precio,
    descripcion: '',
    peso: 0,
    requierePreparacion: false,
    stockActual: 0,
  };
}
