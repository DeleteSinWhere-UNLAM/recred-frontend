export type AccionColor = 'menta' | 'pizarra' | 'dorado' | 'melocoton' | 'mandarina';

export type AccionId = 'buffet' | 'pedidos' | 'favoritos';

export interface AccionRapida {
  id: AccionId;
  label: string;
  descripcion: string;
  icono: string;
  emoji: string;
  color: AccionColor;
  ruta: string | null;
}
