export interface CategoriaProducto {
  id: string;
  descripcion: string;
}

export interface ClasificacionSalud {
  id: string;
  descripcion: string;
}

export type EstadoStock = 'DISPONIBLE' | 'BAJO_STOCK' | 'SIN_STOCK';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: CategoriaProducto;
  clasificacionesSalud: ClasificacionSalud[];
  imagen: string;
  estadoStock: EstadoStock;
  bloqueado?: boolean;
  bloqueadoPorRestriccion?: boolean;
  motivoBloqueo?: string;
  superaPresupuesto?: boolean;
  esCombo?: boolean;
}

export function tieneClasificacion(producto: Producto, descripcion: string): boolean {
  const normalizada = descripcion.toLowerCase();
  return producto.clasificacionesSalud.some(
    (c) => c.descripcion.toLowerCase() === normalizada,
  );
}

export function disponible(producto: Producto): boolean {
  return producto.estadoStock !== 'SIN_STOCK';
}

