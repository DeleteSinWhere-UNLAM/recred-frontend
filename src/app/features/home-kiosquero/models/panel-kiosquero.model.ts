export type KiosqueroOrderStatus =
  | 'PENDIENTE'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'RECHAZADO'
  | 'VENCIDO';

export type KiosqueroPurchaseType = 'PRESENCIAL' | 'ANTICIPADA';

export type KiosqueroInventoryStatus =
  | 'DISPONIBLE'
  | 'BAJO_STOCK'
  | 'SIN_STOCK'
  | 'DESACTIVADO';

export interface PanelKiosquero {
  buffetId: string;
  date: string;
  summary: PanelKiosqueroSummary;
  activity: PanelKiosqueroActivity;
  products: PanelKiosqueroProducts;
  alerts: PanelKiosqueroAlerts;
  trends: PanelKiosqueroTrends;
}

export interface PanelKiosqueroSummary {
  totalSold: number;
  totalOrders: number;
  deliveredOrders: number;
  averageTicket: number;
  pendingOrders: number;
  soldOutProducts: number;
}

export interface PanelKiosqueroActivity {
  salesByTimeSlot: PanelKiosqueroTimeSlotSale[];
  salesByCategory: PanelKiosqueroCategorySale[];
  ordersByStatus: PanelKiosqueroOrdersByStatus[];
  ordersByPurchaseType: PanelKiosqueroOrdersByPurchaseType[];
}

export interface PanelKiosqueroTimeSlotSale {
  pickupSlotId: string | null;
  timeSlot: string;
  pickupSlotStartTime: string | null;
  pickupSlotEndTime: string | null;
  orders: number;
  totalSold: number;
}

export interface PanelKiosqueroCategorySale {
  categoryId: string | null;
  categoryName: string;
  quantity: number;
  total: number;
}

export interface PanelKiosqueroOrdersByStatus {
  status: KiosqueroOrderStatus;
  label: string;
  orders: number;
}

export interface PanelKiosqueroOrdersByPurchaseType {
  type: KiosqueroPurchaseType;
  orders: number;
}

export interface PanelKiosqueroProducts {
  topSoldProducts: PanelKiosqueroProductTotal[];
  mostReservedProducts: PanelKiosqueroProductTotal[];
  productsNeedingRestock: PanelKiosqueroInventoryProduct[];
  soldOutProducts: PanelKiosqueroInventoryProduct[];
}

export interface PanelKiosqueroProductTotal {
  productId: string;
  productName: string;
  quantity: number;
  total: number;
}

export interface PanelKiosqueroInventoryProduct {
  productId: string;
  productName: string;
  stockDisponible: number;
  stockMinimo: number;
  estadoInventario: KiosqueroInventoryStatus;
}

export interface PanelKiosqueroAlerts {
  expiredOrders: number;
  releasedReservations: number;
  refundedCredits: number;
  soldOutEvents: number;
  pendingOrders: number;
  readyOrders: number;
  items: PanelKiosqueroAlertItem[];
}

export interface PanelKiosqueroAlertItem {
  type: string;
  label: string;
  quantity: number;
  amount: number;
}

export interface PanelKiosqueroTrends {
  lastSevenDays: PanelKiosqueroTrendDay[];
  salesByDay?: PanelKiosqueroTrendDay[];
}

export interface PanelKiosqueroTrendDay {
  date: string;
  totalSold: number;
  totalOrders: number;
  deliveredOrders: number;
  createdOrders?: number;
  pendingOrders?: number;
  inPreparationOrders?: number;
  readyOrders?: number;
  cancelledOrders?: number;
  rejectedOrders?: number;
  expiredOrders?: number;
}
