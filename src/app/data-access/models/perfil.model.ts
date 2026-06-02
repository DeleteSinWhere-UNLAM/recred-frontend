export type RolUsuario = 'PADRE' | 'ALUMNO' | 'VENDEDOR';

export interface Perfil {
  readonly id: string;
  readonly email: string;
  readonly nombre: string;
  readonly apellido: string;
  readonly rol: RolUsuario;
}
