export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  peso: number;
  requierePreparacion: boolean;
  stockActual: number;
  urlImagen?: string | null;
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

