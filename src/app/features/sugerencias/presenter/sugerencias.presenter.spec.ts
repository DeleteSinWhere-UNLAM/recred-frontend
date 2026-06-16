import { TestBed } from '@angular/core/testing';
import { SugerenciasPresenter } from './sugerencias.presenter';
import { SugerenciasService } from '../services/sugerencias.service';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { of } from 'rxjs';
import { SugerenciaProducto } from '../models/sugerencia-producto.model';
import { Product } from '../../updated-inventory/models/product.interface';

describe('SugerenciasPresenter', () => {
  let presenter: SugerenciasPresenter;
  let mockSugerenciasService: jasmine.SpyObj<SugerenciasService>;
  let mockPromotionService: jasmine.SpyObj<PromotionService>;

  beforeEach(() => {
    mockSugerenciasService = jasmine.createSpyObj('SugerenciasService', ['getSugerencias', 'getComboSuggestions']);
    mockPromotionService = jasmine.createSpyObj('PromotionService', ['createPromotion']);

    TestBed.configureTestingModule({
      providers: [
        SugerenciasPresenter,
        { provide: SugerenciasService, useValue: mockSugerenciasService },
        { provide: PromotionService, useValue: mockPromotionService }
      ]
    });

    presenter = TestBed.inject(SugerenciasPresenter);
  });

  it('debería crearse', () => {
    expect(presenter).toBeTruthy();
  });

  describe('initialize', () => {
    it('debería cargar sugerencias y seleccionar la primera si existe', () => {
      const mockSugerencias = [
        { productoOriginal: 'P1', estadisticasVenta: { stockActual: 10, diasSinVenta: 5 } },
        { productoOriginal: 'P2', estadisticasVenta: { stockActual: 20, diasSinVenta: 10 } }
      ] as SugerenciaProducto[];
      
      mockSugerenciasService.getSugerencias.and.returnValue(of(mockSugerencias));

      presenter.initialize('user-1');

      expect(mockSugerenciasService.getSugerencias).toHaveBeenCalledWith('user-1');
      expect(presenter.totalProductosAnalizados).toBe(2);
      expect(presenter.totalStockInmovilizado).toBe(30);
      expect(presenter.promedioDiasSinVenta).toBe(8); // (5+10)/2 = 7.5 -> round(7.5) = 8
      expect(presenter.productoMasCritico?.productoOriginal).toBe('P2');
      expect(presenter.estadisticasSeleccionadas?.stockActual).toBe(10);
    });

    it('no debería fallar si no hay sugerencias', () => {
      mockSugerenciasService.getSugerencias.and.returnValue(of([]));

      presenter.initialize('user-1');

      expect(presenter.totalProductosAnalizados).toBe(0);
      expect(presenter.totalStockInmovilizado).toBe(0);
      expect(presenter.promedioDiasSinVenta).toBe(0);
      expect(presenter.productoMasCritico).toBeUndefined();
    });
  });

  describe('openComboPromotionModal', () => {
    it('debería cargar sugerencias de combo y abrir modal si hay producto seleccionado', () => {
      const mockSugerencia = { productoOriginal: 'P1' } as SugerenciaProducto;
      presenter.seleccionarProducto(mockSugerencia);

      const mockProducts = [{ id: 'combo1', nombre: 'Combo 1' }] as Product[];
      mockSugerenciasService.getComboSuggestions.and.returnValue(of(mockProducts));

      presenter['userId'] = 'user-1';
      presenter.openComboPromotionModal();

      expect(mockSugerenciasService.getComboSuggestions).toHaveBeenCalledWith('P1', 'user-1');
      
      let isModalOpen = false;
      presenter.isComboModalOpen$.subscribe(v => isModalOpen = v);
      expect(isModalOpen).toBeTrue();
    });

    it('no debería hacer nada si no hay producto seleccionado', () => {
      presenter.openComboPromotionModal();
      expect(mockSugerenciasService.getComboSuggestions).not.toHaveBeenCalled();
    });
  });

  describe('generatePromotion', () => {
    it('debería crear promoción y cerrar modal si hay producto seleccionado', () => {
      const mockSugerencia = { productoOriginal: 'P1' } as SugerenciaProducto;
      presenter.seleccionarProducto(mockSugerencia);
      mockPromotionService.createPromotion.and.returnValue(of({} as any));

      presenter.generatePromotion({
        discountPercentage: 10,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
        productIds: ['combo1']
      });

      expect(mockPromotionService.createPromotion).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'Combo P1',
        discountPercentage: 10,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
        productIds: ['P1', 'combo1']
      }));

      let isModalOpen = true;
      presenter.isComboModalOpen$.subscribe(v => isModalOpen = v);
      expect(isModalOpen).toBeFalse();
    });
  });
});
