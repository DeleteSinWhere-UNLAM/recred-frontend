export interface Sugerencia {
  categoria: string;
  accion: 'AUMENTAR' | 'REDUCIR' | 'MANTENER' | string;
  motivo: string;
}

export interface PromocionCreada {
  id: string;
  name: string;
  discountPercentage: number;
  productIds: string[];
  startDate: string;
  endDate: string;
  status: string;
  buffet_id?: string;
}

export interface RecomendacionesResponse {
  sugerencias: Sugerencia[];
  tip_promocional?: string;
  promocion_creada?: PromocionCreada;
}
