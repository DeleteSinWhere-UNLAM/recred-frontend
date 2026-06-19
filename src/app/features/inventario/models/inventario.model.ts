export type TipoManejoInventario =
  | 'STOCK_EXACTO'
  | 'DISPONIBLE_NO_DISPONIBLE'
  | 'CUPO_DIARIO';

export type EstadoInventario =
  | 'DISPONIBLE'
  | 'BAJO_STOCK'
  | 'SIN_STOCK'
  | 'DESACTIVADO';

export interface ItemInventario {
  productId: string;
  nombre: string;
  precio: number;
  urlImagen?: string | null;
  tipoManejoInventario: TipoManejoInventario;
  estadoInventario: EstadoInventario;
  stockActual: number | null;
  stockReservado: number | null;
  stockDisponible: number | null;
  stockMinimo: number | null;
  cupoMaximoDiario: number | null;
  cupoDisponibleDia: number | null;
  disponible: boolean;
  bajoStock: boolean;
  agotado: boolean;
}

export type AccionStockRapida =
  | 'SET_STOCK'
  | 'ADD_STOCK'
  | 'SUBTRACT_STOCK'
  | 'MARK_SOLD_OUT'
  | 'SET_AVAILABLE'
  | 'SET_UNAVAILABLE'
  | 'SET_DAILY_CAPACITY';

export interface AccionStockRapidaRequest {
  action: AccionStockRapida;
  quantity?: number;
  stockMinimo?: number;
  motivo?: string;
  usuarioId?: string;
}

export interface ActualizacionStockRequest {
  stockActual?: number;
  stockMinimo?: number;
  estadoInventario?: EstadoInventario;
  tipoManejoInventario?: TipoManejoInventario;
  disponible?: boolean;
  cupoMaximoDiario?: number;
  motivo?: string;
  usuarioId?: string;
}

export type TipoMovimientoStock =
  | 'RESERVA'
  | 'LIBERACION'
  | 'CONSUMO'
  | 'VENTA'
  | 'AJUSTE';

export interface MovimientoStock {
  id: string;
  inventarioId: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  motivo: string | null;
  usuarioId: string | null;
  compraId: string | null;
  creadoEn: string;
}

export interface EventoInventarioRealtime {
  buffetId: string;
  type: string;
  productId?: string;
  inventoryId?: string;
  purchaseId?: string;
  purchaseStatus?: string;
  purchaseTotal?: number;
  stockActual?: number;
  stockReservado?: number;
  stockDisponible?: number;
  stockMinimo?: number;
  cupoMaximoDiario?: number;
  cupoDisponibleDia?: number;
  disponible?: boolean;
  estadoInventario?: EstadoInventario;
  tipoManejoInventario?: TipoManejoInventario;
  movementType?: TipoMovimientoStock | string;
  changeKind?: string;
  reason?: string;
  date?: string;
  occurredAt: string;
  message?: string;
}
