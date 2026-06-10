export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  peso: number;
  requierePreparacion: boolean;
  stockActual: number;
  categoria?: {
    id: string;
    descripcion: string;
  };
  categoriaId?: string | null;
  categoriaNombre?: string;
  clasificacionesSalud?: {
    id: string;
    descripcion: string;
  }[];
}

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
}

export interface UpdateProductRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  peso: number;
  requierePreparacion: boolean;
  stockActual: number;
  buffetId: string;
  categoriaId: string;
  clasificacionesSaludIds: string[];
}
