export interface Sugerencia {
  categoria: string;
  accion: 'AUMENTAR' | 'REDUCIR' | 'MANTENER' | string;
  motivo: string;
}

export interface RecomendacionesResponse {
  sugerencias: Sugerencia[];
  tip_promocional?: string;
}
