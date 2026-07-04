import {
  PurchaseItem,
  ScheduledPickup,
} from './models/tracking-pedidos.model';

export const ORDER_ID_TEST = 'order-1';

export class PurchaseItemMother {
  static crear(override: Partial<PurchaseItem> = {}): PurchaseItem {
    return {
      productId: 'prod-1',
      productName: 'Alfajor',
      quantity: 2,
      unitPrice: 500,
      ...override,
    };
  }
}

export class ScheduledPickupMother {
  static crear(override: Partial<ScheduledPickup> = {}): ScheduledPickup {
    return {
      id: ORDER_ID_TEST,
      studentId: 'alumno-1',
      studentName: 'Juan Perez',
      totalAmount: 1000,
      status: 'PENDIENTE',
      statusLabel: 'A preparar',
      withdrawalStatus: 'PROGRAMADO',
      paymentMethod: 'CREDITOS',
      date: '2026-07-03',
      withdrawalCode: 'ABC123',
      pickupSlotId: 'ts-001',
      pickupSlotDescription: 'Primer recreo',
      pickupDate: '2026-07-03',
      items: [PurchaseItemMother.crear()],
      tipo: 'ANTICIPADA',
      ...override,
    };
  }

  static crearListo(override: Partial<ScheduledPickup> = {}): ScheduledPickup {
    return ScheduledPickupMother.crear({
      id: 'order-listo',
      status: 'LISTO',
      statusLabel: 'Listo para retirar',
      ...override,
    });
  }

  static crearVencido(override: Partial<ScheduledPickup> = {}): ScheduledPickup {
    return ScheduledPickupMother.crear({
      id: 'order-vencido',
      status: 'VENCIDO',
      statusLabel: 'Vencido',
      ...override,
    });
  }

  static crearVarios(): ScheduledPickup[] {
    return [
      ScheduledPickupMother.crear({ id: 'p-pendiente', status: 'PENDIENTE' }),
      ScheduledPickupMother.crearListo({ id: 'p-listo' }),
      ScheduledPickupMother.crearVencido({ id: 'p-vencido' }),
      ScheduledPickupMother.crear({
        id: 'p-otra-fecha',
        pickupDate: '2026-07-04',
        pickupSlotId: 'ts-002',
        pickupSlotDescription: 'Segundo recreo',
        studentName: 'Maria Lopez',
        withdrawalCode: 'XYZ789',
      }),
    ];
  }
}
