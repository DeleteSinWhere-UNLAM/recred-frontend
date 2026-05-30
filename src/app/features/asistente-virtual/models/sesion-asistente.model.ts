import { MensajeAsistente } from './mensaje-asistente.model';

export interface SesionAsistente {
  readonly id: string | null;
  readonly mensajes: readonly MensajeAsistente[];
}
