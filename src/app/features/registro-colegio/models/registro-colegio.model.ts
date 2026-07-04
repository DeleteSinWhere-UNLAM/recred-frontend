export interface NivelEducativo {
  readonly id: string;
  readonly descripcion: string;
}

export interface SchoolRegistrationPayload {
  readonly schoolName: string;
  readonly schoolEmail: string;
  readonly schoolPhone: string;
  readonly schoolCue: string;
  readonly schoolLevel: { id: string };
  readonly directorFirstName: string;
  readonly directorLastName: string;
  readonly directorEmail: string;
  readonly directorPhone: string;
  readonly directorDni: string;
  readonly directorUsername: string;
}

export const NIVELES_EDUCATIVOS: NivelEducativo[] = [
  { id: 'afb3ed96-73ab-4b7d-ada9-e2fe514e495b', descripcion: 'Primario y Secundario' },
  { id: 'afb3ed96-73ab-4b7d-ada9-e2fe514e495b', descripcion: 'Solo Inicial' },
  { id: 'afb3ed96-73ab-4b7d-ada9-e2fe514e495b', descripcion: 'Solo Primario' },
  { id: 'afb3ed96-73ab-4b7d-ada9-e2fe514e495b', descripcion: 'Solo Secundario' },
];
