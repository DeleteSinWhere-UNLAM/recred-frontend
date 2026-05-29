import { TipoUsuario } from './tipo-usuario.model';

export interface DatosRegistro {
  readonly nombreCompleto: string;
  readonly email: string;
  readonly password: string;
  readonly telefono: string;
  readonly direccion: string;
  readonly tipoUsuario: TipoUsuario;
}
