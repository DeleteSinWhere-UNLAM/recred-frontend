export interface DailyCloseResult {
  alreadyClosed: boolean;
  expiredPurchases: number;
  releasedReservations: number;
  refundedCredits: number;
  report: DailyReport;
}

export interface DailyCloseStatus {
  buffetId: string;
  date: string;
  closed: boolean;
  expiredPurchases: number;
  releasedReservations: number;
  refundedCredits: number;
}

export interface DailyCloseRecord {
  id: string;
  buffetId: string;
  date: string;
  expiredPurchases: number;
  releasedReservations: number;
  refundedCredits: number;
}

export interface DailyCloseHistoryFilters {
  from?: string;
  to?: string;
}

export interface DailyReport {
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
  products: DailyProductSale[];
  inventory: DailyInventorySnapshot[];
  soldOutProducts: DailySoldOutProduct[];
  salesByPaymentMethod: DailySalesByPaymentMethod[];
  stockMovements: DailyStockMovement[];
}

export interface DailyProductSale {
  productId: string;
  productName: string;
  quantity: number;
  total: number;
}

export interface DailyInventorySnapshot {
  productId: string;
  productName: string;
  stockActual: number | null;
  stockReservado: number | null;
  stockDisponible: number | null;
  stockMinimo?: number | null;
  estadoInventario: string;
  tipoManejoInventario: string;
}

export interface DailySoldOutProduct {
  productId?: string;
  productName?: string;
  nombre?: string;
}

export interface DailySalesByPaymentMethod {
  paymentMethod: string;
  orders: number;
  total: number;
}

export interface DailyStockMovement {
  movementType: string;
  quantity: number;
}
