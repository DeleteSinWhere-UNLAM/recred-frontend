import { Alumno } from '../../../data-access/models/alumno.model';
import { ItemCarrito } from './carrito.model';

export type Recreo =
  | 'PRIMER_RECREO'
  | 'SEGUNDO_RECREO'
  | 'MEDIODIA'
  | 'FUERA_HORA'
  | 'ONCE_AM'
  | 'DIECISEIS_PM';

export interface OrdenAlumno {
  alumno: Alumno;
  buffetId: string;
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
  ONCE_AM: '11:00 hs',
  DIECISEIS_PM: '16:00 hs',
};
