import { ItemResumenInventario } from './inventario.interface';
import {
  compararPorEstadoOperativo,
  esAltaReserva,
  getEstadoOperativoStock,
  obtenerRatioDisponibilidad,
  obtenerRatioReserva,
} from './estado-visual-inventario';

class ItemMother {
  static crear(override: Partial<ItemResumenInventario> = {}): ItemResumenInventario {
    return {
      productId: 'prod-1',
      nombre: 'Alfajor',
      precio: 100,
      tipoManejoInventario: 'STOCK_EXACTO',
      estadoInventario: 'DISPONIBLE',
      stockActual: 10,
      stockReservado: 2,
      stockDisponible: 8,
      stockMinimo: 5,
      cupoMaximoDiario: null,
      cupoDisponibleDia: null,
      disponible: true,
      bajoStock: false,
      agotado: false,
      ...override,
    };
  }
}

describe('estado-visual-inventario', () => {
  describe('getEstadoOperativoStock — DISPONIBLE_NO_DISPONIBLE', () => {
    it('dado un producto disponible, deberia devolver OK', () => {
      const item = ItemMother.crear({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        estadoInventario: 'DISPONIBLE',
        agotado: false,
      });

      expect(getEstadoOperativoStock(item)).toBe('OK');
    });

    it('dado un producto DISPONIBLE_NO_DISPONIBLE con estado DESACTIVADO, deberia devolver PAUSADO', () => {
      const item = ItemMother.crear({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        estadoInventario: 'DESACTIVADO',
      });

      expect(getEstadoOperativoStock(item)).toBe('PAUSADO');
    });

    it('dado un producto DISPONIBLE_NO_DISPONIBLE agotado, deberia devolver PAUSADO', () => {
      const item = ItemMother.crear({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        agotado: true,
      });

      expect(getEstadoOperativoStock(item)).toBe('PAUSADO');
    });
  });

  describe('getEstadoOperativoStock — STOCK_EXACTO', () => {
    it('dado DESACTIVADO, deberia ser PAUSADO', () => {
      expect(getEstadoOperativoStock(ItemMother.crear({ estadoInventario: 'DESACTIVADO' }))).toBe('PAUSADO');
    });

    it('dado agotado true, deberia ser AGOTADO', () => {
      expect(getEstadoOperativoStock(ItemMother.crear({ agotado: true }))).toBe('AGOTADO');
    });

    it('dado disponible false, deberia ser PAUSADO', () => {
      expect(getEstadoOperativoStock(ItemMother.crear({ disponible: false }))).toBe('PAUSADO');
    });

    it('dado bajoStock true, deberia ser BAJO_STOCK', () => {
      expect(getEstadoOperativoStock(ItemMother.crear({ bajoStock: true }))).toBe('BAJO_STOCK');
    });

    it('dado alta reserva (>= 50%), deberia ser ALTA_RESERVA', () => {
      const item = ItemMother.crear({ stockDisponible: 3, stockReservado: 7, bajoStock: false });
      expect(getEstadoOperativoStock(item)).toBe('ALTA_RESERVA');
    });

    it('dado un producto normal, deberia ser OK', () => {
      expect(getEstadoOperativoStock(ItemMother.crear())).toBe('OK');
    });
  });

  describe('esAltaReserva', () => {
    it('dado ratio 50%, deberia ser alta reserva', () => {
      expect(esAltaReserva(ItemMother.crear({ stockDisponible: 5, stockReservado: 5 }))).toBeTrue();
    });

    it('dado ratio bajo, no deberia ser alta reserva', () => {
      expect(esAltaReserva(ItemMother.crear({ stockDisponible: 9, stockReservado: 1 }))).toBeFalse();
    });
  });

  describe('obtenerRatioReserva', () => {
    it('dado stock total 0, deberia devolver 0', () => {
      const ratio = obtenerRatioReserva(ItemMother.crear({ stockDisponible: 0, stockReservado: 0 }));

      expect(ratio).toBe(0);
    });

    it('dado stock reservado negativo, deberia clampearlo a 0', () => {
      const ratio = obtenerRatioReserva(ItemMother.crear({ stockDisponible: 10, stockReservado: -3 }));

      expect(ratio).toBe(0);
    });

    it('dado stock reservado null, deberia usar 0', () => {
      const ratio = obtenerRatioReserva(ItemMother.crear({ stockDisponible: 5, stockReservado: null as unknown as number }));

      expect(ratio).toBe(0);
    });
  });

  describe('obtenerRatioDisponibilidad', () => {
    it('dado total > 0, deberia devolver available/total', () => {
      const item = ItemMother.crear({ stockDisponible: 8, stockReservado: 2 });

      expect(obtenerRatioDisponibilidad(item)).toBe(0.8);
    });

    it('dado sin stock pero disponible y no agotado, deberia devolver 1', () => {
      const item = ItemMother.crear({ stockDisponible: 0, stockReservado: 0, disponible: true, agotado: false });

      expect(obtenerRatioDisponibilidad(item)).toBe(1);
    });

    it('dado sin stock y agotado, deberia devolver 0', () => {
      const item = ItemMother.crear({ stockDisponible: 0, stockReservado: 0, disponible: false, agotado: true });

      expect(obtenerRatioDisponibilidad(item)).toBe(0);
    });
  });

  describe('compararPorEstadoOperativo', () => {
    it('dado dos productos con distintos estados, deberia ordenar primero el mas critico', () => {
      const agotado = ItemMother.crear({ agotado: true, nombre: 'B' });
      const ok = ItemMother.crear({ nombre: 'A' });

      const items = [ok, agotado].sort(compararPorEstadoOperativo);

      expect(items[0]).toBe(agotado);
    });

    it('dado dos productos con mismo estado, deberia ordenar alfabeticamente por nombre', () => {
      const primero = ItemMother.crear({ nombre: 'A' });
      const segundo = ItemMother.crear({ nombre: 'B' });

      const items = [segundo, primero].sort(compararPorEstadoOperativo);

      expect(items[0]).toBe(primero);
    });
  });
});
