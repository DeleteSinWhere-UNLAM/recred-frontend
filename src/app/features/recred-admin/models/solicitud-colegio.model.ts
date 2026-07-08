export type EstadoSolicitud = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SchoolRegistration {
  readonly id: string;
  readonly schoolName: string;
  readonly schoolEmail: string;
  readonly schoolPhone: string;
  readonly schoolCue: string;
  readonly directorFirstName: string;
  readonly directorLastName: string;
  readonly directorEmail: string;
  readonly directorPhone: string;
  readonly directorDni: string;
  readonly directorUsername: string;
  readonly status: EstadoSolicitud;
  readonly createdAt: string;
}
