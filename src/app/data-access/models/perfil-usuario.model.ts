import { RolUsuario } from './perfil.model';

export interface UsuarioLogueado {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: RolUsuario;
  readonly colegioId?: string | null;
  readonly schoolId?: string | null;
}

export interface PerfilUsuario extends UsuarioLogueado {
  readonly phone?: string | null;
  readonly documentNumber?: string | null;
  readonly urlFotoPerfil?: string | null;
  readonly fechaVencimientoPlan?: string | null;
  readonly estadoLicenciaColegio?: string | null;
  readonly fechaVencimientoLicenciaColegio?: string | null;
  readonly fechaVencimientoLicencia?: string | null;
  readonly fechaVencimientoSuscripcionColegio?: string | null;
  readonly licenciaColegio?: {
    readonly estado?: string | null;
    readonly fechaInicio?: string | null;
    readonly fechaVencimiento?: string | null;
    readonly fechaGraciaHasta?: string | null;
    readonly monto?: number | null;
    readonly moneda?: string | null;
  } | null;
}

export interface ActualizarPerfilUsuarioRequest {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly documentNumber?: string;
}
