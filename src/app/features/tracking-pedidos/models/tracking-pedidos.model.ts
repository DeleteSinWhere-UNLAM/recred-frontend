export type EstadoCompra =
  | 'PENDIENTE'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'RECHAZADO'
  | 'VENCIDO';
export type EstadoRetiro = 'PROGRAMADO' | 'LISTO' | 'RETIRADO' | 'NO_RETIRADO' | 'CANCELADO';

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ScheduledPickup {
  id: string;
  studentId: string;
  studentName: string;
  totalAmount: number;
  status: EstadoCompra;
  statusLabel: string;
  withdrawalStatus: EstadoRetiro;
  paymentMethod: string;
  date: string;
  withdrawalCode: string;
  pickupSlotId: string;
  pickupSlotDescription: string;
  pickupDate: string;
  items: PurchaseItem[];
  tipo?: 'ANTICIPADA' | 'PRESENCIAL';
}

export interface TimeSlotFilter {
  id: string;
  description: string;
}
