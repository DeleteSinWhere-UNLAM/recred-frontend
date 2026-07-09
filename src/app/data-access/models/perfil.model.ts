export type RolUsuario = 'PADRE' | 'ALUMNO' | 'VENDEDOR' | 'ADMIN' | 'DIRECTIVO_COLEGIO';

export interface ReferenciaPerfil {
  readonly id?: string | null;
}

export interface Perfil {
  readonly id: string;
  readonly email: string;
  readonly plan?: string;
  readonly nombre: string;
  readonly apellido: string;
  readonly rol: RolUsuario;
  readonly buffetId?: string | null;
  readonly colegioId?: string | null;
  readonly schoolId?: string | null;
  readonly buffet?: ReferenciaPerfil | null;
  readonly colegio?: ReferenciaPerfil | null;
  readonly school?: ReferenciaPerfil | null;
  readonly buffets?: readonly ReferenciaPerfil[] | null;
  readonly comercioId?: string | null;
  readonly comercio?: ReferenciaPerfil | null;
  readonly kioscoId?: string | null;
  readonly kiosco?: ReferenciaPerfil | null;
  readonly alumnoId?: string | null;
  readonly alumno?: ReferenciaPerfil | null;
  readonly alumnoEntity?: ReferenciaPerfil | null;
  readonly studentId?: string | null;
  readonly student?: ReferenciaPerfil | null;
  readonly phone?: string | null;
  readonly documentNumber?: string | null;
  readonly urlFotoPerfil?: string | null;
  readonly fechaVencimientoPlan?: string | null;
  readonly estadoLicenciaColegio?: string | null;
  readonly fechaVencimientoLicenciaColegio?: string | null;
  readonly fechaVencimientoLicencia?: string | null;
  readonly fechaVencimientoSuscripcionColegio?: string | null;
  readonly hasUsedTrial?: boolean | null;
}
