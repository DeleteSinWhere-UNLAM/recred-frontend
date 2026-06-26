import { Producto } from '../../inventario/models/producto.interface';

export interface Sugerencia {
  categoria: string;
  accion: 'AUMENTAR' | 'REDUCIR' | 'MANTENER' | string;
  motivo: string;
  icono?: string;
  top_productos?: Producto[];
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

export interface PromocionSugerida {
  nombre: string;
  descuento: number;
  categorias_destino: string[];
  imagen?: string;
  productIds?: string[];
}

export interface InfoEstacion {
  estacion_actual: string;
  dias_restantes: number;
  proxima_estacion: string;
}

export interface InfoClima {
  temperature: number;
  condition: string;
  ciudad?: string;
  provincia?: string;
}

export interface RecomendacionesResponse {
  sugerencias: Sugerencia[];
  tip_promocional?: string;
  promocion_creada?: PromocionCreada;
  promocion_sugerida?: PromocionSugerida;
  info_estacion?: InfoEstacion;
  clima_actual?: InfoClima;
}
