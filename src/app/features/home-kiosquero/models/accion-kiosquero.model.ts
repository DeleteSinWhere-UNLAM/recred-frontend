export type AccionKiosqueroId =
  | 'ver-pedidos'
  | 'venta-espontanea'
  | 'tracking-pedidos'
  | 'cargar-productos'
  | 'cierre-diario'
  | 'reportes'
  | 'stock'
  | 'inteligencia-comercial'
  | 'sugerencias'
  | 'recomendaciones'
  | 'recomendaciones-estacionales'
  | 'oportunidades-stock'
  | 'promociones'
  | 'proveedores';

export type AccionKiosqueroColor =
  | 'pizarra'
  | 'menta'
  | 'dorado'
  | 'melocoton'
  | 'violeta';

export type PlanRequeridoAccion = 'INTERMEDIO' | 'AVANZADO';

export interface AccionKiosquero {
  id: AccionKiosqueroId;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color?: AccionKiosqueroColor;
  destacada?: boolean;
  premium?: boolean;
  planRequerido?: PlanRequeridoAccion;
}
