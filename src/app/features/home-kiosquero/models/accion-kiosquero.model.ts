export type AccionKiosqueroId =
  | 'cargar-productos'
  | 'cierre-diario'
  | 'stock'
  | 'sugerencias'
  | 'recomendaciones';

export type AccionKiosqueroColor = 'pizarra' | 'menta' | 'dorado' | 'melocoton';

export interface AccionKiosquero {
  id: AccionKiosqueroId;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color?: AccionKiosqueroColor;
}
