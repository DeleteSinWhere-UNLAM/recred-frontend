export type AccionKiosqueroId =
  | 'cargar-productos'
  | 'dashboard'
  | 'stock'
  | 'sugerencias'
  | 'recomendaciones';

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
}
