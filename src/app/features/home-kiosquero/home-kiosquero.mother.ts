import {
  PanelKiosquero,
  PanelKiosqueroActivity,
  PanelKiosqueroAlerts,
  PanelKiosqueroInventoryProduct,
  PanelKiosqueroProducts,
  PanelKiosqueroSummary,
  PanelKiosqueroTrends,
} from './models/panel-kiosquero.model';

export const BUFFET_ID_TEST = 'buffet-1';
export const FECHA_TEST = '2026-06-11';

export class PanelKiosqueroSummaryMother {
  static crear(override: Partial<PanelKiosqueroSummary> = {}): PanelKiosqueroSummary {
    return {
      totalSold: 28500,
      totalOrders: 12,
      deliveredOrders: 7,
      averageTicket: 4071,
      pendingOrders: 4,
      soldOutProducts: 7,
      ...override,
    };
  }
}

export class PanelKiosqueroActivityMother {
  static crear(override: Partial<PanelKiosqueroActivity> = {}): PanelKiosqueroActivity {
    return {
      salesByTimeSlot: [
        {
          pickupSlotId: null,
          timeSlot: 'Compra espontanea',
          pickupSlotStartTime: null,
          pickupSlotEndTime: null,
          orders: 2,
          totalSold: 5000,
        },
        {
          pickupSlotId: 'slot-1',
          timeSlot: 'Primer recreo',
          pickupSlotStartTime: '09:30:00',
          pickupSlotEndTime: '09:45:00',
          orders: 3,
          totalSold: 3000,
        },
      ],
      salesByCategory: [
        { categoryId: 'cat-1', categoryName: 'Golosinas', quantity: 8, total: 12000 },
        { categoryId: null, categoryName: 'Sin categoria', quantity: 4, total: 6000 },
      ],
      ordersByStatus: [
        { status: 'EN_PREPARACION', label: 'En preparación', orders: 2 },
        { status: 'LISTO', label: 'Listo para retirar', orders: 3 },
      ],
      ordersByPurchaseType: [
        { type: 'PRESENCIAL', orders: 8 },
        { type: 'ANTICIPADA', orders: 4 },
      ],
      ...override,
    };
  }

  static crearVacia(): PanelKiosqueroActivity {
    return {
      salesByTimeSlot: [],
      salesByCategory: [],
      ordersByStatus: [],
      ordersByPurchaseType: [],
    };
  }
}

export class PanelKiosqueroInventoryProductMother {
  static crearBajoStock(override: Partial<PanelKiosqueroInventoryProduct> = {}): PanelKiosqueroInventoryProduct {
    return {
      productId: 'low-1',
      productName: 'Alfajor',
      stockDisponible: 2,
      stockMinimo: 5,
      estadoInventario: 'BAJO_STOCK',
      ...override,
    };
  }

  static crearAgotado(override: Partial<PanelKiosqueroInventoryProduct> = {}): PanelKiosqueroInventoryProduct {
    return {
      productId: 'sold-out-1',
      productName: 'Jugo',
      stockDisponible: 0,
      stockMinimo: 4,
      estadoInventario: 'SIN_STOCK',
      ...override,
    };
  }
}

export class PanelKiosqueroProductsMother {
  static crear(override: Partial<PanelKiosqueroProducts> = {}): PanelKiosqueroProducts {
    return {
      topSoldProducts: [],
      mostReservedProducts: [],
      productsNeedingRestock: [
        PanelKiosqueroInventoryProductMother.crearBajoStock(),
        PanelKiosqueroInventoryProductMother.crearAgotado(),
      ],
      soldOutProducts: [PanelKiosqueroInventoryProductMother.crearAgotado()],
      ...override,
    };
  }
}

export class PanelKiosqueroAlertsMother {
  static crear(override: Partial<PanelKiosqueroAlerts> = {}): PanelKiosqueroAlerts {
    return {
      expiredOrders: 1,
      releasedReservations: 0,
      refundedCredits: 0,
      soldOutEvents: 50,
      pendingOrders: 99,
      readyOrders: 3,
      items: [],
      ...override,
    };
  }
}

export class PanelKiosqueroTrendsMother {
  static crearVacio(): PanelKiosqueroTrends {
    return { lastSevenDays: [] };
  }
}

export class PanelKiosqueroMother {
  static crear(override: Partial<PanelKiosquero> = {}): PanelKiosquero {
    return {
      buffetId: BUFFET_ID_TEST,
      date: FECHA_TEST,
      summary: PanelKiosqueroSummaryMother.crear(),
      activity: PanelKiosqueroActivityMother.crear(),
      products: PanelKiosqueroProductsMother.crear(),
      alerts: PanelKiosqueroAlertsMother.crear(),
      trends: PanelKiosqueroTrendsMother.crearVacio(),
      ...override,
    };
  }

  static crearVacio(): PanelKiosquero {
    return {
      buffetId: BUFFET_ID_TEST,
      date: FECHA_TEST,
      summary: PanelKiosqueroSummaryMother.crear({
        totalSold: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        averageTicket: 0,
        pendingOrders: 0,
        soldOutProducts: 0,
      }),
      activity: PanelKiosqueroActivityMother.crearVacia(),
      products: { topSoldProducts: [], mostReservedProducts: [], productsNeedingRestock: [], soldOutProducts: [] },
      alerts: PanelKiosqueroAlertsMother.crear({
        expiredOrders: 0,
        soldOutEvents: 0,
        pendingOrders: 0,
        readyOrders: 0,
      }),
      trends: PanelKiosqueroTrendsMother.crearVacio(),
    };
  }
}
