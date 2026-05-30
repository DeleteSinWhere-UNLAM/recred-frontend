import { CapacidadAsistente } from './capacidad-asistente.model';

export interface RespuestaAsistente {
  readonly sesionId: string;
  readonly respuesta: string;
  readonly capacidades: readonly CapacidadAsistente[];
  readonly fechaHora: string;
  readonly generadoPorIa: boolean;
  readonly modelo: string | null;
}
