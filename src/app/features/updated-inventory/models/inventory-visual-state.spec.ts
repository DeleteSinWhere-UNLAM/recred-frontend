import {
  getOperationalStockStatus,
  isHighReservation,
  getReservationRatio,
  getAvailabilityRatio,
  compareByOperationalStatus,
  HIGH_RESERVATION_THRESHOLD
} from './inventory-visual-state';
import { InventoryOverviewItem, EstadoInventario, TipoManejoInventario } from './inventory.interface';

describe('InventoryVisualState', () => {
  const createMockProduct = (overrides: Partial<InventoryOverviewItem> = {}): InventoryOverviewItem => ({
    productId: '1',
    nombre: 'Test Product',
    stockDisponible: 10,
    stockReservado: 0,
    disponible: true,
    agotado: false,
    bajoStock: false,
    estadoInventario: 'DISPONIBLE' as EstadoInventario,
    tipoManejoInventario: 'STOCK_EXACTO' as TipoManejoInventario,
    ...overrides,
  } as InventoryOverviewItem);

  describe('getOperationalStockStatus', () => {
    it('debería retornar OK si es DISPONIBLE_NO_DISPONIBLE y está disponible', () => {
      const product = createMockProduct({ tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE', disponible: true, estadoInventario: 'DISPONIBLE', agotado: false });
      expect(getOperationalStockStatus(product)).toBe('OK');
    });

    it('debería retornar PAUSADO si es DISPONIBLE_NO_DISPONIBLE y no está disponible', () => {
      const product = createMockProduct({ tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE', disponible: false });
      expect(getOperationalStockStatus(product)).toBe('PAUSADO');
    });

    it('debería retornar PAUSADO si estadoInventario es DESACTIVADO', () => {
      const product = createMockProduct({ estadoInventario: 'DESACTIVADO' });
      expect(getOperationalStockStatus(product)).toBe('PAUSADO');
    });

    it('debería retornar AGOTADO si agotado es true', () => {
      const product = createMockProduct({ agotado: true });
      expect(getOperationalStockStatus(product)).toBe('AGOTADO');
    });

    it('debería retornar AGOTADO si estadoInventario es SIN_STOCK', () => {
      const product = createMockProduct({ estadoInventario: 'SIN_STOCK' });
      expect(getOperationalStockStatus(product)).toBe('AGOTADO');
    });

    it('debería retornar PAUSADO si disponible es false', () => {
      const product = createMockProduct({ disponible: false });
      expect(getOperationalStockStatus(product)).toBe('PAUSADO');
    });

    it('debería retornar BAJO_STOCK si bajoStock es true', () => {
      const product = createMockProduct({ bajoStock: true });
      expect(getOperationalStockStatus(product)).toBe('BAJO_STOCK');
    });

    it('debería retornar BAJO_STOCK si estadoInventario es BAJO_STOCK', () => {
      const product = createMockProduct({ estadoInventario: 'BAJO_STOCK' });
      expect(getOperationalStockStatus(product)).toBe('BAJO_STOCK');
    });

    it('debería retornar ALTA_RESERVA si la reserva es alta', () => {
      const product = createMockProduct({ stockDisponible: 4, stockReservado: 6 });
      expect(getOperationalStockStatus(product)).toBe('ALTA_RESERVA');
    });

    it('debería retornar OK si todo está normal', () => {
      const product = createMockProduct();
      expect(getOperationalStockStatus(product)).toBe('OK');
    });
  });

  describe('isHighReservation', () => {
    it('debería retornar true si ratio >= threshold', () => {
      const product = createMockProduct({ stockDisponible: 5, stockReservado: 5 });
      expect(isHighReservation(product)).toBeTrue();
    });

    it('debería retornar false si ratio < threshold', () => {
      const product = createMockProduct({ stockDisponible: 9, stockReservado: 1 });
      expect(isHighReservation(product)).toBeFalse();
    });
  });

  describe('getReservationRatio', () => {
    it('debería calcular el ratio de reservas', () => {
      const product = createMockProduct({ stockDisponible: 8, stockReservado: 2 });
      expect(getReservationRatio(product)).toBe(0.2);
    });

    it('debería retornar 0 si total <= 0', () => {
      const product = createMockProduct({ stockDisponible: 0, stockReservado: 0 });
      expect(getReservationRatio(product)).toBe(0);
    });
    
    it('debería retornar 0 si hay nulos o negativos', () => {
      const product = createMockProduct({ stockDisponible: null, stockReservado: -5 } as any);
      expect(getReservationRatio(product)).toBe(0);
    });
  });

  describe('getAvailabilityRatio', () => {
    it('debería retornar ratio de disponibles vs total', () => {
      const product = createMockProduct({ stockDisponible: 8, stockReservado: 2 });
      expect(getAvailabilityRatio(product)).toBe(0.8);
    });

    it('debería retornar 1 si total es 0, disponible=true, agotado=false', () => {
      const product = createMockProduct({ stockDisponible: 0, stockReservado: 0, disponible: true, agotado: false });
      expect(getAvailabilityRatio(product)).toBe(1);
    });

    it('debería retornar 0 si total es 0, disponible=false', () => {
      const product = createMockProduct({ stockDisponible: 0, stockReservado: 0, disponible: false });
      expect(getAvailabilityRatio(product)).toBe(0);
    });
  });

  describe('compareByOperationalStatus', () => {
    it('debería ordenar por prioridad de status', () => {
      const agotado = createMockProduct({ nombre: 'B', agotado: true });
      const bajoStock = createMockProduct({ nombre: 'A', bajoStock: true });
      
      expect(compareByOperationalStatus(agotado, bajoStock)).toBeLessThan(0);
      expect(compareByOperationalStatus(bajoStock, agotado)).toBeGreaterThan(0);
    });

    it('debería ordenar alfabéticamente si tienen el mismo status', () => {
      const p1 = createMockProduct({ nombre: 'A' });
      const p2 = createMockProduct({ nombre: 'B' });
      
      expect(compareByOperationalStatus(p1, p2)).toBeLessThan(0);
      expect(compareByOperationalStatus(p2, p1)).toBeGreaterThan(0);
      expect(compareByOperationalStatus(p1, { ...p1 })).toBe(0);
    });
  });
});
