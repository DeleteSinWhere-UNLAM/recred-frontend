import { Alumno } from '../../../data-access/models/alumno.model';
import { ItemCarrito } from './carrito.model';

export type Recreo =
  | 'PRIMER_RECREO'
  | 'SEGUNDO_RECREO'
  | 'MEDIODIA'
  | 'FUERA_HORA';

export interface OrdenAlumno {
  alumno: Alumno;
  items: ItemCarrito[];
  fecha: string;
  recreo: Recreo;
  subtotal: number;
}

export interface OrdenCompra {
  id: string;
  ordenes: OrdenAlumno[];
  total: number;
  codigos: Record<string, string>;
  sugerenciaId?: string;
}

export const RECREO_LABELS: Record<Recreo, string> = {
  PRIMER_RECREO: '1er Recreo',
  SEGUNDO_RECREO: '2do Recreo',
  MEDIODIA: 'Mediodía',
  FUERA_HORA: 'Fuera de hora',
};
