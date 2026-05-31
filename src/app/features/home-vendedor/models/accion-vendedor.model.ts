export type AccionVendedorId =
  | 'cargar-productos'
  | 'dashboard'
  | 'stock'
  | 'sugerencias'
  | 'recomendaciones';

export type AccionVendedorColor = 'pizarra' | 'menta' | 'dorado' | 'melocoton';

export interface AccionVendedor {
  id: AccionVendedorId;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color?: AccionVendedorColor;
}
