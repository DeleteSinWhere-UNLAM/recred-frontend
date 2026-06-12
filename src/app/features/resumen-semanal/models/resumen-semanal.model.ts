export interface ResumenSemanal {
  fechaDesde: string;
  fechaHasta: string;
  id: string;
  resumen: string;
}

export interface ResumenProcesado {
  hijos: Record<string, HijoResumen>;
  mensaje: string;
}

export interface HijoResumen {
  nombre: string;
  porCategoria: Record<string, number>;
  totalGastado: number;
  productoMasConsumido?: ProductoConsumido;
}

export interface ProductoConsumido {
  nombre: string;
  precio: number;
  cantidad: number;
}
