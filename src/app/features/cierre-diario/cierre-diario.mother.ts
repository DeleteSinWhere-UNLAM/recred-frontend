import {
  EstadoCierreDiario,
  MovimientoStockDiario,
  ProductoAgotadoDiario,
  RegistroCierreDiario,
  ReporteDiario,
  ResultadoCierreDiario,
  SnapshotInventarioDiario,
  VentaProductoDiaria,
  VentasDiariasPorMedioPago,
} from './models/cierre-diario.model';

export const BUFFET_ID_TEST = 'buffet-test';
export const FECHA_TEST = '2026-06-09';

export class VentaProductoDiariaMother {
  static crear(override: Partial<VentaProductoDiaria> = {}): VentaProductoDiaria {
    return {
      productId: 'prod-1',
      productName: 'Alfajor',
      quantity: 5,
      total: 2500,
      ...override,
    };
  }
}

export class SnapshotInventarioDiarioMother {
  static crear(override: Partial<SnapshotInventarioDiario> = {}): SnapshotInventarioDiario {
    return {
      productId: 'prod-1',
      productName: 'Alfajor',
      stockActual: 10,
      stockReservado: 0,
      stockDisponible: 10,
      stockMinimo: 3,
      estadoInventario: 'DISPONIBLE',
      tipoManejoInventario: 'STOCK_EXACTO',
      ...override,
    };
  }

  static crearBajoStock(override: Partial<SnapshotInventarioDiario> = {}): SnapshotInventarioDiario {
    return SnapshotInventarioDiarioMother.crear({
      estadoInventario: 'BAJO_STOCK',
      stockActual: 2,
      stockDisponible: 2,
      stockMinimo: 5,
      ...override,
    });
  }

  static crearAgotado(override: Partial<SnapshotInventarioDiario> = {}): SnapshotInventarioDiario {
    return SnapshotInventarioDiarioMother.crear({
      estadoInventario: 'SIN_STOCK',
      stockActual: 0,
      stockDisponible: 0,
      stockMinimo: null,
      ...override,
    });
  }
}

export class ProductoAgotadoDiarioMother {
  static crear(override: Partial<ProductoAgotadoDiario> = {}): ProductoAgotadoDiario {
    return {
      productId: 'prod-agotado',
      productName: 'Jugo',
      ...override,
    };
  }
}

export class VentasDiariasPorMedioPagoMother {
  static crear(override: Partial<VentasDiariasPorMedioPago> = {}): VentasDiariasPorMedioPago {
    return {
      paymentMethod: 'EFECTIVO',
      orders: 2,
      total: 1500,
      ...override,
    };
  }
}

export class MovimientoStockDiarioMother {
  static crear(override: Partial<MovimientoStockDiario> = {}): MovimientoStockDiario {
    return {
      movementType: 'VENTA',
      quantity: 10,
      ...override,
    };
  }
}

export class ReporteDiarioMother {
  static crear(override: Partial<ReporteDiario> = {}): ReporteDiario {
    return {
      buffetId: BUFFET_ID_TEST,
      date: FECHA_TEST,
      totalOrders: 25,
      deliveredOrders: 18,
      pendingOrders: 2,
      inPreparationOrders: 1,
      readyOrders: 1,
      expiredOrders: 3,
      cancelledOrders: 0,
      rejectedOrders: 0,
      deliveredTotal: 12500,
      refundedCredits: 0,
      releasedReservations: 8,
      products: [VentaProductoDiariaMother.crear()],
      inventory: [
        SnapshotInventarioDiarioMother.crearBajoStock({ productId: 'prod-1', productName: 'Alfajor' }),
        SnapshotInventarioDiarioMother.crearAgotado({ productId: 'prod-2', productName: 'Jugo' }),
      ],
      soldOutProducts: [ProductoAgotadoDiarioMother.crear()],
      salesByPaymentMethod: [],
      stockMovements: [],
      ...override,
    };
  }
}

export class EstadoCierreDiarioMother {
  static crear(override: Partial<EstadoCierreDiario> = {}): EstadoCierreDiario {
    return {
      buffetId: BUFFET_ID_TEST,
      date: FECHA_TEST,
      closed: false,
      expiredPurchases: 0,
      releasedReservations: 0,
      refundedCredits: 0,
      ...override,
    };
  }

  static crearCerrado(override: Partial<EstadoCierreDiario> = {}): EstadoCierreDiario {
    return EstadoCierreDiarioMother.crear({
      closed: true,
      expiredPurchases: 3,
      releasedReservations: 8,
      ...override,
    });
  }
}

export class RegistroCierreDiarioMother {
  static crear(override: Partial<RegistroCierreDiario> = {}): RegistroCierreDiario {
    return {
      id: 'close-1',
      buffetId: BUFFET_ID_TEST,
      date: FECHA_TEST,
      expiredPurchases: 3,
      releasedReservations: 8,
      refundedCredits: 0,
      ...override,
    };
  }
}

export class ResultadoCierreDiarioMother {
  static crear(override: Partial<ResultadoCierreDiario> = {}): ResultadoCierreDiario {
    return {
      alreadyClosed: false,
      expiredPurchases: 3,
      releasedReservations: 8,
      refundedCredits: 0,
      report: ReporteDiarioMother.crear(),
      ...override,
    };
  }

  static crearYaCerrado(): ResultadoCierreDiario {
    return ResultadoCierreDiarioMother.crear({
      alreadyClosed: true,
      expiredPurchases: 0,
      releasedReservations: 0,
    });
  }
}
