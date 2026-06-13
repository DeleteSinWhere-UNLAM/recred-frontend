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
  /** Bloqueado manualmente por el tutor con el candado. Se oculta al alumno. */
  bloqueado?: boolean;
  /** Bloqueado por restricción nutricional u horaria. Se muestra al alumno pero deshabilitado. */
  bloqueadoPorRestriccion?: boolean;
  /** Motivo de bloqueo devuelto por el backend (visible para el tutor). */
  motivoBloqueo?: string;
  superaPresupuesto?: boolean;
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
