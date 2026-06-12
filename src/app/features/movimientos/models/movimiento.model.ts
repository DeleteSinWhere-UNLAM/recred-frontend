export interface ItemMovimiento {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Movimiento {
  id: string;
  studentId: string;
  totalAmount: number;
  status: string;
  statusLabel: string;
  paymentMethod: string;
  date: string;
  items: ItemMovimiento[];
  tipo?: 'ANTICIPADA' | 'PRESENCIAL';
  withdrawalCode?: string;
  pickupSlotDescription?: string;
  pickupDate?: string;
}
