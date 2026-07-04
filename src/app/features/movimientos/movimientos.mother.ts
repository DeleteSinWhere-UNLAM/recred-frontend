import { ItemMovimiento, Movimiento } from './models/movimiento.model';

export const ALUMNO_UUID_TEST = '550e8400-e29b-41d4-a716-446655440000';
export const ALUMNO_NO_UUID = 'julian-garcia';

export class ItemMovimientoMother {
  static crear(override: Partial<ItemMovimiento> = {}): ItemMovimiento {
    return {
      productId: 'prod-1',
      productName: 'Tostado',
      quantity: 1,
      unitPrice: 1500,
      ...override,
    };
  }
}

export class MovimientoMother {
  static crear(override: Partial<Movimiento> = {}): Movimiento {
    return {
      id: 'mov-1',
      studentId: 'alumno-1',
      totalAmount: 1500,
      status: 'APPROVED',
      statusLabel: 'Aprobado',
      paymentMethod: 'CREDIT',
      date: '2026-06-05T10:00:00Z',
      items: [ItemMovimientoMother.crear()],
      ...override,
    };
  }

  static crearPendiente(override: Partial<Movimiento> = {}): Movimiento {
    return MovimientoMother.crear({
      id: 'mov-pendiente',
      status: 'PENDIENTE',
      statusLabel: 'Pendiente',
      ...override,
    });
  }

  static crearAnticipada(override: Partial<Movimiento> = {}): Movimiento {
    return MovimientoMother.crear({
      id: 'mov-anticipada',
      tipo: 'ANTICIPADA',
      status: 'PENDIENTE',
      statusLabel: 'Pendiente',
      pickupDate: '2026-07-15',
      pickupSlotDescription: 'Primer recreo',
      pickupSlotStartTime: '10:00',
      ...override,
    });
  }

  static crearCancelado(override: Partial<Movimiento> = {}): Movimiento {
    return MovimientoMother.crear({
      status: 'CANCELADO',
      statusLabel: 'Cancelado',
      ...override,
    });
  }
}
