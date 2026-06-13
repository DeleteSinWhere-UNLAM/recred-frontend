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

