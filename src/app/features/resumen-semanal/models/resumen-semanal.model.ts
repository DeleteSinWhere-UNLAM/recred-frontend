export interface ResumenSemanal {
  fechaDesde: string;
  fechaHasta: string;
  id: string;
  resumen: string;
}

export interface ResumenProcesado {
  hijos: Record<string, HijoResumen>;
  mensajes: MensajeHijo[];
}

export interface HijoResumen {
  nombre?: string;
  totalGastado: number;
  LimiteGasto?: number;
  porCategoria: Record<string, number>;
  productoMasConsumido?: ProductoConsumido;
}

export interface ProductoConsumido {
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface MensajeHijo {
  nombre: string;
  mensaje: string;
}
