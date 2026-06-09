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
  totalGastado: number;
  productoMasConsumido: ProductoConsumido;
  porCategoria: Record<string, number>;
}

export interface ProductoConsumido {
  nombre: string;
  precio: number;
  cantidad: number;
}
