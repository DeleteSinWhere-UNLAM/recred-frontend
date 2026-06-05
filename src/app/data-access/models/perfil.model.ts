export type RolUsuario = 'PADRE' | 'ALUMNO' | 'VENDEDOR';

export interface ReferenciaPerfil {
  readonly id?: string | null;
}

export interface Perfil {
  readonly id: string;
  readonly email: string;
  readonly nombre: string;
  readonly apellido: string;
  readonly rol: RolUsuario;
  readonly buffetId?: string | null;
  readonly buffet?: ReferenciaPerfil | null;
  readonly buffets?: readonly ReferenciaPerfil[] | null;
  readonly comercioId?: string | null;
  readonly comercio?: ReferenciaPerfil | null;
  readonly kioscoId?: string | null;
  readonly kiosco?: ReferenciaPerfil | null;
}
