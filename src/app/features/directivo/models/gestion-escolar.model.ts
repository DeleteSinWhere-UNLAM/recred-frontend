export interface NivelColegio {
  readonly id: string;
  readonly descripcion: string;
  readonly activo: boolean;
}

export interface GradoColegio {
  readonly id: string;
  readonly colegioId: string;
  readonly nivelId: string;
  readonly nivelDescripcion: string;
  readonly nombre: string;
  readonly anio: string;
  readonly division: string;
  readonly activo: boolean;
}

export interface GradoPayload {
  readonly nivelId: string;
  readonly anio: string;
  readonly division: string;
}

export interface FranjaHorariaColegio {
  readonly id: string;
  readonly colegioId: string;
  readonly descripcion: string;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly activo: boolean;
  readonly cupoMaximo?: number | null;
  readonly minutosCorte?: number | null;
}

export interface FranjaHorariaPayload {
  readonly descripcion: string;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly cupoMaximo?: number | null;
  readonly minutosCorte?: number | null;
}

