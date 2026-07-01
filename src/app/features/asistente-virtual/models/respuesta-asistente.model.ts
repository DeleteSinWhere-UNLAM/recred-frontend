import { CapacidadAsistente } from './capacidad-asistente.model';

export const INTENCION_CANCELAR_COMPRA = 'CANCEL_PURCHASE' as const;
export const TIPO_ACCION_CANCELACION_COMPRA = 'CANCELACION_COMPRA' as const;
export const ESTADO_COMPRA_CANCELADO = 'CANCELADO' as const;
export const ESTADO_ESPERANDO_FECHA = 'ESPERANDO_FECHA' as const;
export const INPUT_FECHA_RETIRO = 'FECHA_RETIRO' as const;

export type IntencionAsistente =
  | typeof INTENCION_CANCELAR_COMPRA
  | (string & {});

export type TipoAccionAsistente =
  | typeof TIPO_ACCION_CANCELACION_COMPRA
  | (string & {});

export type EstadoAccionAsistente =
  | 'PENDIENTE'
  | 'ESPERANDO_CONFIRMACION'
  | 'ESPERANDO_RECREO'
  | typeof ESTADO_ESPERANDO_FECHA
  | 'EJECUTADA'
  | 'CANCELADA'
  | 'FALLIDA'
  | 'INFORMATIVA'
  | (string & {});

export type EstadoCompraAsistente =
  | typeof ESTADO_COMPRA_CANCELADO
  | (string & {});

export type InputRequeridoAsistente =
  | typeof INPUT_FECHA_RETIRO
  | (string & {});

export interface AccionAsistente {
  readonly tipo?: TipoAccionAsistente | null;
  readonly estado?: EstadoAccionAsistente | null;
  readonly status?: EstadoAccionAsistente | null;
  readonly requiereInput?: boolean | null;
  readonly inputsRequeridos?: readonly InputRequeridoAsistente[] | null;
  readonly requiredInputs?: readonly InputRequeridoAsistente[] | null;
  readonly compraId?: string | null;
  readonly estadoCompra?: EstadoCompraAsistente | null;
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
  readonly intencion?: IntencionAsistente | null;
  readonly accion?: AccionAsistente | null;
  readonly action?: AccionAsistente | null;
  readonly sugerencias?: readonly SugerenciaRespuestaAsistente[];
  readonly datos?: Record<string, unknown> | null;
  readonly fechaHora?: string;
  readonly generadoPorIa?: boolean;
  readonly modelo?: string | null;
}
