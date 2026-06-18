export interface CreateProductRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  peso: number;
  requierePreparacion: boolean;
  categoriaId: string | null;
  nuevaCategoriaNombre: string;
  buffetId: string;
  stockActual: number;
  clasificacionesSaludIds: string[];
  tiposIds: null;
  urlImagen?: string | null;
}
