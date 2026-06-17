export interface TimeSlot {
  readonly id: string;
  readonly colegioId: string;
  readonly descripcion: string;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly activo: boolean;
}

export interface RestriccionHoraria {
  readonly id: string;
  readonly studentId: string;
  readonly timeSlotId?: string | null;
  readonly categoryId?: string | null;
  readonly classificationId?: string | null;
  readonly activa: boolean;
  readonly franjaHoraria?: {
    id: string;
    descripcion: string;
  };
  readonly categoria?: {
    id: string;
    descripcion: string;
  };
  readonly clasificacionSalud?: {
    id: string;
    descripcion: string;
  };
}

export interface TimeRestrictionCommand {
  readonly studentId: string;
  readonly timeSlotId: string;
  readonly categoryId?: string | null;
  readonly classificationId?: string | null;
}
