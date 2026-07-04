export type EstadoSolicitud = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SchoolLevel {
  readonly id: string;
  readonly descripcion: string;
}

export interface SchoolRegistration {
  readonly id: string;
  readonly schoolName: string;
  readonly schoolEmail: string;
  readonly schoolPhone: string;
  readonly schoolCue: string;
  readonly schoolLevel: SchoolLevel;
  readonly directorFirstName: string;
  readonly directorLastName: string;
  readonly directorEmail: string;
  readonly directorPhone: string;
  readonly directorDni: string;
  readonly directorUsername: string;
  readonly status: EstadoSolicitud;
  readonly createdAt: string;
}
