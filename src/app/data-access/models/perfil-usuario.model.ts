import { RolUsuario } from './perfil.model';

export interface UsuarioLogueado {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: RolUsuario;
}

export interface PerfilUsuario extends UsuarioLogueado {
  readonly phone?: string | null;
  readonly documentNumber?: string | null;
}

export interface ActualizarPerfilUsuarioRequest {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly documentNumber?: string;
}
