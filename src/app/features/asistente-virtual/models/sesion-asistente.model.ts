import { MensajeAsistente } from './mensaje-asistente.model';

export interface SesionAsistente {
  readonly id: string | null;
  readonly mensajes: readonly MensajeAsistente[];
}

export type EstadoSesionAsistente = 'ABIERTA' | 'CERRADA' | 'EXPIRADA';

export interface SesionAsistenteResponse {
  readonly sesionId: string;
  readonly estado: EstadoSesionAsistente;
  readonly fechaInicio: string;
  readonly fechaUltimaActividad: string;
}

export interface MensajeAsistenteResponse {
  readonly id: string;
  readonly sesionId: string;
  readonly rol: 'USUARIO' | 'ASISTENTE_IA';
  readonly contenido: string;
  readonly metadata?: Record<string, unknown> | null;
  readonly fechaHora: string;
}
