export interface ResultadoCierreDiario {
  alreadyClosed: boolean;
  expiredPurchases: number;
  releasedReservations: number;
  refundedCredits: number;
  report: ReporteDiario;
}

export interface EstadoCierreDiario {
  buffetId: string;
  date: string;
  closed: boolean;
  expiredPurchases: number;
  releasedReservations: number;
  refundedCredits: number;
}

export interface RegistroCierreDiario {
  id: string;
  buffetId: string;
  date: string;
  expiredPurchases: number;
  releasedReservations: number;
  refundedCredits: number;
}

export interface FiltrosHistorialCierreDiario {
  from?: string;
  to?: string;
}

export interface ReporteDiario {
  buffetId: string;
  date: string;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  inPreparationOrders: number;
  readyOrders: number;
  expiredOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  deliveredTotal: number;
  refundedCredits: number;
  releasedReservations: number;
  products: VentaProductoDiaria[];
  inventory: SnapshotInventarioDiario[];
  soldOutProducts: ProductoAgotadoDiario[];
  salesByPaymentMethod: VentasDiariasPorMedioPago[];
  stockMovements: MovimientoStockDiario[];
}

export interface VentaProductoDiaria {
  productId: string;
  productName: string;
  quantity: number;
  total: number;
}

export interface SnapshotInventarioDiario {
  productId: string;
  productName: string;
  stockActual: number | null;
  stockReservado: number | null;
  stockDisponible: number | null;
  stockMinimo?: number | null;
  estadoInventario: string;
  tipoManejoInventario: string;
}

export interface ProductoAgotadoDiario {
  productId?: string;
  productName?: string;
  nombre?: string;
}

export interface VentasDiariasPorMedioPago {
  paymentMethod: string;
  orders: number;
  total: number;
}

export interface MovimientoStockDiario {
  movementType: string;
  quantity: number;
}
