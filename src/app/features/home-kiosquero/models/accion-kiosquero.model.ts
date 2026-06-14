export type AccionKiosqueroId =
  | 'ver-pedidos'
  | 'cargar-productos'
  | 'cierre-diario'
  | 'reportes'
  | 'stock'
  | 'sugerencias'
  | 'recomendaciones'
  | 'recomendaciones-estacionales';

export type AccionKiosqueroColor = 'pizarra' | 'menta' | 'dorado' | 'melocoton';

export interface AccionKiosquero {
  id: AccionKiosqueroId;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color?: AccionKiosqueroColor;
}
