export interface SaveProductRequest {
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
  tiposIds: string[];
}
