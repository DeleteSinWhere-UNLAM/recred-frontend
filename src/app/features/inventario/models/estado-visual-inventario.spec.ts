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
    it('dado un producto DISPONIBLE_NO_DISPONIBLE disponible, cuando pido el estado, deberia devolver OK', () => {
      const item = ItemMother.crear({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        estadoInventario: 'DISPONIBLE',
        agotado: false,
      });

      const estado = whenPidoElEstadoDe(item);

      thenElEstadoEs(estado, 'OK');
    });

    it('dado un producto DISPONIBLE_NO_DISPONIBLE con estado DESACTIVADO, cuando pido el estado, deberia devolver PAUSADO', () => {
      const item = ItemMother.crear({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        estadoInventario: 'DESACTIVADO',
      });

      const estado = whenPidoElEstadoDe(item);

      thenElEstadoEs(estado, 'PAUSADO');
    });

    it('dado un producto DISPONIBLE_NO_DISPONIBLE agotado, cuando pido el estado, deberia devolver PAUSADO', () => {
      const item = ItemMother.crear({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        agotado: true,
      });

      const estado = whenPidoElEstadoDe(item);

      thenElEstadoEs(estado, 'PAUSADO');
    });
  });

  describe('getEstadoOperativoStock — STOCK_EXACTO', () => {
    it('dado un producto DESACTIVADO, cuando pido el estado, deberia ser PAUSADO', () => {
      thenElEstadoEs(whenPidoElEstadoDe(ItemMother.crear({ estadoInventario: 'DESACTIVADO' })), 'PAUSADO');
    });

    it('dado un producto agotado, cuando pido el estado, deberia ser AGOTADO', () => {
      thenElEstadoEs(whenPidoElEstadoDe(ItemMother.crear({ agotado: true })), 'AGOTADO');
    });

    it('dado un producto con disponible en false, cuando pido el estado, deberia ser PAUSADO', () => {
      thenElEstadoEs(whenPidoElEstadoDe(ItemMother.crear({ disponible: false })), 'PAUSADO');
    });

    it('dado un producto con bajoStock true, cuando pido el estado, deberia ser BAJO_STOCK', () => {
      thenElEstadoEs(whenPidoElEstadoDe(ItemMother.crear({ bajoStock: true })), 'BAJO_STOCK');
    });

    it('dado un producto con alta reserva (>= 50%), cuando pido el estado, deberia ser ALTA_RESERVA', () => {
      const item = ItemMother.crear({ stockDisponible: 3, stockReservado: 7, bajoStock: false });

      thenElEstadoEs(whenPidoElEstadoDe(item), 'ALTA_RESERVA');
    });

    it('dado un producto normal, cuando pido el estado, deberia ser OK', () => {
      thenElEstadoEs(whenPidoElEstadoDe(ItemMother.crear()), 'OK');
    });
  });

  describe('esAltaReserva', () => {
    it('dado ratio 50%, cuando consulto esAltaReserva, deberia ser true', () => {
      expect(whenConsultoEsAltaReserva(ItemMother.crear({ stockDisponible: 5, stockReservado: 5 }))).toBeTrue();
    });

    it('dado ratio bajo, cuando consulto esAltaReserva, deberia ser false', () => {
      expect(whenConsultoEsAltaReserva(ItemMother.crear({ stockDisponible: 9, stockReservado: 1 }))).toBeFalse();
    });
  });

  describe('obtenerRatioReserva', () => {
    it('dado stock total 0, cuando pido el ratio, deberia devolver 0', () => {
      const ratio = whenPidoElRatioDeReserva(ItemMother.crear({ stockDisponible: 0, stockReservado: 0 }));

      thenElRatioEs(ratio, 0);
    });

    it('dado stock reservado negativo, cuando pido el ratio, deberia clampearlo a 0', () => {
      const ratio = whenPidoElRatioDeReserva(ItemMother.crear({ stockDisponible: 10, stockReservado: -3 }));

      thenElRatioEs(ratio, 0);
    });

    it('dado stock reservado null, cuando pido el ratio, deberia usar 0', () => {
      const ratio = whenPidoElRatioDeReserva(
        ItemMother.crear({ stockDisponible: 5, stockReservado: null as unknown as number }),
      );

      thenElRatioEs(ratio, 0);
    });
  });

  describe('obtenerRatioDisponibilidad', () => {
    it('dado total > 0, cuando pido el ratio, deberia devolver available/total', () => {
      const item = ItemMother.crear({ stockDisponible: 8, stockReservado: 2 });

      thenElRatioEs(whenPidoElRatioDeDisponibilidad(item), 0.8);
    });

    it('dado sin stock pero disponible y no agotado, cuando pido el ratio, deberia devolver 1', () => {
      const item = ItemMother.crear({ stockDisponible: 0, stockReservado: 0, disponible: true, agotado: false });

      thenElRatioEs(whenPidoElRatioDeDisponibilidad(item), 1);
    });

    it('dado sin stock y agotado, cuando pido el ratio, deberia devolver 0', () => {
      const item = ItemMother.crear({ stockDisponible: 0, stockReservado: 0, disponible: false, agotado: true });

      thenElRatioEs(whenPidoElRatioDeDisponibilidad(item), 0);
    });
  });

  describe('compararPorEstadoOperativo', () => {
    it('dado dos productos con distintos estados, cuando ordeno, deberia poner primero el mas critico', () => {
      const agotado = ItemMother.crear({ agotado: true, nombre: 'B' });
      const ok = ItemMother.crear({ nombre: 'A' });

      const items = whenOrdenoPorEstado([ok, agotado]);

      expect(items[0]).toBe(agotado);
    });

    it('dado dos productos con mismo estado, cuando ordeno, deberia hacerlo alfabeticamente por nombre', () => {
      const primero = ItemMother.crear({ nombre: 'A' });
      const segundo = ItemMother.crear({ nombre: 'B' });

      const items = whenOrdenoPorEstado([segundo, primero]);

      expect(items[0]).toBe(primero);
    });
  });

  function whenPidoElEstadoDe(item: ItemResumenInventario): string {
    return getEstadoOperativoStock(item);
  }

  function whenConsultoEsAltaReserva(item: ItemResumenInventario): boolean {
    return esAltaReserva(item);
  }

  function whenPidoElRatioDeReserva(item: ItemResumenInventario): number {
    return obtenerRatioReserva(item);
  }

  function whenPidoElRatioDeDisponibilidad(item: ItemResumenInventario): number {
    return obtenerRatioDisponibilidad(item);
  }

  function whenOrdenoPorEstado(items: ItemResumenInventario[]): ItemResumenInventario[] {
    return items.sort(compararPorEstadoOperativo);
  }

  function thenElEstadoEs(actual: string, esperado: string): void {
    expect(actual).toBe(esperado);
  }

  function thenElRatioEs(actual: number, esperado: number): void {
    expect(actual).toBe(esperado);
  }
});
