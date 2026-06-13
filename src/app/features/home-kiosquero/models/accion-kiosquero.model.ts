export type AccionKiosqueroId =
  | 'venta-espontanea'
  | 'tracking-pedidos'
  | 'cargar-productos'
  | 'dashboard'
  | 'stock'
  | 'sugerencias'
  | 'recomendaciones'
  | 'promociones';

export type AccionKiosqueroColor =
  | 'pizarra'
  | 'menta'
  | 'dorado'
  | 'melocoton'
  | 'violeta';

export interface AccionKiosquero {
  id: AccionKiosqueroId;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color?: AccionKiosqueroColor;
  destacada?: boolean;
}
