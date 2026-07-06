export interface Vendedor {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  cuit: string;
}

export interface Buffet {
  id: string;
  nombre: string;
  activo: boolean;
  vendedor: Vendedor | null;
}

export interface SchoolOverview {
  id: string;
  nombre: string;
  cue: string;
  buffets: Buffet[];
}

export interface CrearBuffetRequest {
  name: string;
  habilitationExpirationDate: string;
}

export interface CrearBuffetResponse {
  buffetId: string;
}

export interface CrearVendedorRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  cuit: string;
}

export interface CrearVendedorResponse {
  kiosqueroId: string;
  usuarioId: string;
}
