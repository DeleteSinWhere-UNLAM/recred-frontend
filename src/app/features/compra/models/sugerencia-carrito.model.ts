export type OrigenSugerenciaCarrito =
  | 'STUDENT_CART_AFFINITY'
  | 'BUFFET_CART_AFFINITY'
  | 'FAVORITE'
  | 'DETECTED_PREFERENCE'
  | 'PURCHASE_HISTORY'
  | 'DAY_PATTERN';

export interface SugerenciaCarrito {
  productId: string;
  productName: string;
  price: number;
  stockActual: number;
  reason: string;
  source: OrigenSugerenciaCarrito;
  score: number;
}

export interface ItemSugerenciaCarritoRequest {
  productId: string;
  quantity: number;
}

export interface SugerenciaCarritoRequest {
  studentId: string;
  buffetId: string;
  items: ItemSugerenciaCarritoRequest[];
  limit?: number;
}
