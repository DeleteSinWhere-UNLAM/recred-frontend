export interface SolicitudActualizarProducto {
  nombre: string;
  descripcion: string;
  precio: number;
  peso: number;
  requierePreparacion: boolean;
  stockActual: number;
  buffetId: string;
  categoriaId: string;
  clasificacionesSaludIds: string[];
  urlImagen?: string | null;
}
