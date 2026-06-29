import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SugerenciasAgregarPresenter } from './sugerencias-agregar.presenter';
import { SugerenciasAgregarService } from '../services/sugerencias-agregar.service';
import { SugerenciaAgregarProducto } from '../models/sugerencia-agregar.model';

describe('SugerenciasAgregarPresenter', () => {
  let presenter: SugerenciasAgregarPresenter;
  let mockSugerenciasAgregarService: jasmine.SpyObj<SugerenciasAgregarService>;

  const mockData: SugerenciaAgregarProducto[] = [
    {
      id: '1',
      alumnoId: null,
      buffetId: 'b1',
      productoId: 'p1',
      titulo: 'Title 1',
      mensaje: 'Msg 1',
      metadata: { totalSales: 10, productName: 'Prod A', productPrice: 100, totalRevenue: 1000, totalCustomers: 5 }
    },
    {
      id: '2',
      alumnoId: null,
      buffetId: 'b1',
      productoId: 'p2',
      titulo: 'Title 2',
      mensaje: 'Msg 2',
      metadata: { totalSales: 20, productName: 'Prod B', productPrice: 50, totalRevenue: 1000, totalCustomers: 10 }
    },
    {
      id: '3',
      alumnoId: null,
      buffetId: 'b1',
      productoId: 'p3',
      titulo: 'Title 3',
      mensaje: 'Msg 3',
      metadata: { totalSales: 5, productName: 'Prod C', productPrice: 400, totalRevenue: 2000, totalCustomers: 2 }
    }
  ];

  beforeEach(() => {
    mockSugerenciasAgregarService = jasmine.createSpyObj('SugerenciasAgregarService', ['getSugerenciasAgregarProducto']);

    TestBed.configureTestingModule({
      providers: [
        SugerenciasAgregarPresenter,
        { provide: SugerenciasAgregarService, useValue: mockSugerenciasAgregarService }
      ]
    });

    presenter = TestBed.inject(SugerenciasAgregarPresenter);
  });

  it('debería inicializarse correctamente y cargar sugerencias', () => {
    mockSugerenciasAgregarService.getSugerenciasAgregarProducto.and.returnValue(of(mockData));
    
    presenter.initialize();

    expect(mockSugerenciasAgregarService.getSugerenciasAgregarProducto).toHaveBeenCalled();
    
    presenter.sugerencias$.subscribe(s => {
      expect(s).toEqual(mockData);
    });

    presenter.isLoading$.subscribe(loading => {
      expect(loading).toBeFalse();
    });

    presenter.error$.subscribe(error => {
      expect(error).toBeNull();
    });
  });

  it('debería manejar errores al inicializar', () => {
    mockSugerenciasAgregarService.getSugerenciasAgregarProducto.and.returnValue(throwError(() => new Error('Error')));
    
    presenter.initialize();

    presenter.error$.subscribe(error => {
      expect(error).toBe('No se pudieron cargar las oportunidades de stock.');
    });

    presenter.isLoading$.subscribe(loading => {
      expect(loading).toBeFalse();
    });
  });

  describe('KPIs computados', () => {
    beforeEach(() => {
      mockSugerenciasAgregarService.getSugerenciasAgregarProducto.and.returnValue(of(mockData));
      presenter.initialize();
    });

    it('debería calcular totalProductos correctamente', () => {
      expect(presenter.totalProductos).toBe(3);
    });

    it('debería calcular totalVentas correctamente', () => {
      expect(presenter.totalVentas).toBe(10 + 20 + 5); // 35
    });

    it('debería calcular totalIngresos correctamente', () => {
      expect(presenter.totalIngresos).toBe(1000 + 1000 + 2000); // 4000
    });

    it('debería calcular totalClientes correctamente', () => {
      expect(presenter.totalClientes).toBe(5 + 10 + 2); // 17
    });

    it('debería formatear totalIngresosLabel correctamente', () => {
      expect(presenter.totalIngresosLabel).toBe('$4.000');
    });
  });

  describe('Chart data y Producto Cards', () => {
    beforeEach(() => {
      mockSugerenciasAgregarService.getSugerenciasAgregarProducto.and.returnValue(of(mockData));
      presenter.initialize();
    });

    it('debería generar chartData ordenado por ingresos y calcular ingresoPercent relativo al maximo', () => {
      const data = presenter.chartData;
      
      // Sorted by revenue descending (Prod C: 2000, Prod A: 1000, Prod B: 1000)
      expect(data.length).toBe(3);
      expect(data[0].nombre).toBe('Prod C');
      expect(data[0].ingresos).toBe(2000);
      expect(data[0].ingresoPercent).toBe(100); // 2000 / 2000 * 100

      expect(data[1].ingresoPercent).toBe(50); // 1000 / 2000 * 100
    });

    it('debería generar productCards ordenado por ingresos con los campos correctos', () => {
      const cards = presenter.productCards;
      
      expect(cards.length).toBe(3);
      expect(cards[0].nombre).toBe('Prod C');
      expect(cards[0].ingresoPercent).toBe(100);
      expect(cards[0].mensaje).toBe('Msg 3');
    });
  });

  describe('Helpers', () => {
    it('debería formatear moneda correctamente', () => {
      expect(presenter.formatCurrency(1500)).toBe('$1.500');
      expect(presenter.formatCurrency(0)).toBe('$0');
    });
  });
});
