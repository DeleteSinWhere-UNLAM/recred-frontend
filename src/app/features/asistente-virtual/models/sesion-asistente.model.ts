import { MensajeAsistente } from './mensaje-asistente.model';
import {
  AccionAsistente,
  IntencionAsistente,
} from './respuesta-asistente.model';

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

export type EstadoAccionChatbot =
  | 'PENDIENTE'
  | 'ESPERANDO_FECHA'
  | 'EJECUTADA'
  | 'CANCELADA'
  | 'FALLIDA'
  | 'INFORMATIVA';

export interface AccionPendienteChatbot {
  readonly tipo?: string | null;
}

export interface MetadataMensajeAsistente {
  readonly intencionChatbot?: IntencionAsistente | null;
  readonly estadoAccionChatbot?: EstadoAccionChatbot | null;
  readonly accionPendienteChatbot?: AccionPendienteChatbot | null;
}

export interface MensajeAsistenteResponse {
  readonly id: string;
  readonly sesionId: string;
  readonly rol: 'USUARIO' | 'ASISTENTE_IA';
  readonly contenido: string;
  readonly metadata?: MetadataMensajeAsistente | null;
  readonly accion?: AccionAsistente | null;
  readonly fechaHora: string;
}
