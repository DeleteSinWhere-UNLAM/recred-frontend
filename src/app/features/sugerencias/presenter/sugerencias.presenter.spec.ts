import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SugerenciasPresenter } from './sugerencias.presenter';
import { SugerenciasService } from '../services/sugerencias.service';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { of } from 'rxjs';
import { SugerenciaProducto, ComboSuggestion } from '../models/sugerencia-producto.model';
import { Promotion } from '../../../data-access/services/promociones/promotion.service';
import { ProductoService } from '../../inventario/services/producto.service';

describe('SugerenciasPresenter', () => {
  let presenter: SugerenciasPresenter;
  let mockSugerenciasService: jasmine.SpyObj<SugerenciasService>;
  let mockPromotionService: jasmine.SpyObj<PromotionService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockProductoService: jasmine.SpyObj<ProductoService>;

  beforeEach(() => {
    mockSugerenciasService = jasmine.createSpyObj('SugerenciasService', ['getSugerencias', 'getComboSuggestions']);
    mockPromotionService = jasmine.createSpyObj('PromotionService', ['createPromotion']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockToastService = jasmine.createSpyObj('ToastService', ['mostrar']);
    mockProductoService = jasmine.createSpyObj('ProductoService', ['getById']);
    mockProductoService.getById.and.returnValue(of({} as unknown as Producto));

    TestBed.configureTestingModule({
      providers: [
        SugerenciasPresenter,
        { provide: SugerenciasService, useValue: mockSugerenciasService },
        { provide: PromotionService, useValue: mockPromotionService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastService, useValue: mockToastService },
        { provide: ProductoService, useValue: mockProductoService }
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
      const mockSugerencia = {
        productoOriginal: 'P1',
        estadisticasVenta: { productoId: 'P1' }
      } as unknown as SugerenciaProducto;
      presenter.seleccionarProducto(mockSugerencia);

      const mockComboSuggestion: ComboSuggestion = {
        idProduct: 'P1',
        productName: 'P1',
        suggestedProducts: [{ id: 'combo1', nombre: 'Combo 1', precio: 100 }]
      };
      mockSugerenciasService.getComboSuggestions.and.returnValue(of(mockComboSuggestion));

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
      const mockSugerencia = { 
        productoOriginal: 'P1',
        estadisticasVenta: { productoId: 'P1' }
      } as unknown as SugerenciaProducto;
      presenter.seleccionarProducto(mockSugerencia);
      mockProductoService.getById.and.callFake((id) => of({ id, urlImagen: `http://res.cloudinary.com/djzfudbze/image/upload/v1/${id}.png` } as unknown as Producto));
      mockPromotionService.createPromotion.and.returnValue(of({} as Promotion));

      presenter.generatePromotion({
        discountPercentage: 10,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
        productIds: ['combo1']
      });

      expect(mockPromotionService.createPromotion).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'Combo P1',
        discountPercentage: 10,
        startDate: new Date('2026-06-16').toISOString(),
        endDate: new Date('2026-06-20').toISOString(),
        productIds: ['P1', 'combo1'],
        imageUrl: jasmine.any(String)
      }));

      let isModalOpen = true;
      presenter.isComboModalOpen$.subscribe(v => isModalOpen = v);
      expect(isModalOpen).toBeFalse();

      expect(mockToastService.mostrar).toHaveBeenCalledWith('Combo creado exitosamente', 'success');
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });
  });
});
