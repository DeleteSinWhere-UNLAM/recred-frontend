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
  licencia?: LicenciaColegio | null;
  suscripcion?: LicenciaColegio | null;
  estadoLicencia?: string | null;
  fechaVencimientoLicencia?: string | null;
  fechaVencimientoSuscripcion?: string | null;
  licenciaFechaVencimiento?: string | null;
  fechaVencimientoPlan?: string | null;
}

export interface LicenciaColegio {
  estado?: string | null;
  fechaInicio?: string | null;
  fechaVencimiento?: string | null;
  fechaGraciaHasta?: string | null;
  monto?: number | null;
  moneda?: string | null;
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
