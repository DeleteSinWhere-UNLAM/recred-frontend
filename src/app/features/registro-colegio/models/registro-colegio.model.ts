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
  { id: '11111111-1111-1111-1111-111111111111', descripcion: 'Primario y Secundario' },
  { id: '22222222-2222-2222-2222-222222222222', descripcion: 'Solo Inicial' },
  { id: '33333333-3333-3333-3333-333333333333', descripcion: 'Solo Primario' },
  { id: '44444444-4444-4444-4444-444444444444', descripcion: 'Solo Secundario' },
];
