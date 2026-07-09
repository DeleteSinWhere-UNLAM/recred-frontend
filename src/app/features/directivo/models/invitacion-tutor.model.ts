export type EstadoInvitacionTutor =
  | 'PENDING'
  | 'ACCOUNT_CREATED'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type ResultadoInvitacionTutor =
  | 'CREATED'
  | 'RESENT'
  | 'ALREADY_ASSOCIATED'
  | 'CREATED_EMAIL_ERROR'
  | 'RESENT_EMAIL_ERROR'
  | 'VALIDATED';

export type ResultadoPreparacionCuentaTutor =
  | 'LOGIN_REQUIRED'
  | 'USERNAME_REQUIRED'
  | 'ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT';

export interface InvitacionTutorPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface InvitacionTutor {
  id: string;
  schoolId: string;
  schoolName: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: EstadoInvitacionTutor;
  expiresAt: string;
  invitationLink: string | null;
  result: ResultadoInvitacionTutor;
}

export interface PreparacionCuentaTutor {
  invitationId: string;
  schoolId: string;
  schoolName: string;
  email: string;
  result: ResultadoPreparacionCuentaTutor;
}

export interface ErrorFilaCsv {
  row: number;
  email: string;
  message: string;
}

export interface ReporteImportacionCsv {
  totalRows: number;
  createdInvitations: number;
  resentInvitations: number;
  alreadyAssociated: number;
  errors: ErrorFilaCsv[];
}

export interface ColegioAsociadoTutor {
  id: string;
  nombre: string;
}
