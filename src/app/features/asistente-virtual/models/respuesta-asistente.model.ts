import { CapacidadAsistente } from './capacidad-asistente.model';

export interface AccionAsistente {
  readonly tipo?: string | null;
  readonly estado?: string | null;
  readonly requiereInput?: boolean | null;
  readonly inputsRequeridos?: readonly string[] | null;
  readonly compraId?: string | null;
  readonly estadoCompra?: string | null;
  readonly codigoRetiro?: string | null;
  readonly total?: number | null;
  readonly recreo?: string | null;
  readonly datos?: Record<string, unknown> | null;
}

export interface SugerenciaRespuestaAsistente {
  readonly label: string;
  readonly mensaje: string;
  readonly tipoAccion?: string | null;
}

export interface RespuestaAsistente {
  readonly sesionId: string;
  readonly respuesta: string;
  readonly capacidades?: readonly CapacidadAsistente[];
  readonly rol?: string | null;
  readonly intencion?: string | null;
  readonly accion?: AccionAsistente | null;
  readonly sugerencias?: readonly SugerenciaRespuestaAsistente[];
  readonly datos?: Record<string, unknown> | null;
  readonly fechaHora?: string;
  readonly generadoPorIa?: boolean;
  readonly modelo?: string | null;
}
