export type TipoMovimientoBilletera =
  | 'CARGA'
  | 'COMPRA'
  | 'REEMBOLSO'
  | 'TRANSFERENCIA'
  | string;

export type DireccionMovimiento = 'ENTRADA' | 'SALIDA';

export type ClasificacionSalud = 'Saludable' | 'No saludable' | 'Sin clasificar' | string;

export interface PeriodoBilletera {
  desde: string;
  hasta: string;
}

export interface GastoPorCategoria {
  categoria: string;
  monto: number;
  porcentaje: number;
}

export interface GastoPorClasificacionSalud {
  clasificacion: ClasificacionSalud;
  monto: number;
  porcentaje: number;
}

export interface MovimientoBilletera {
  id: string;
  fechaHora: string;
  tipo: TipoMovimientoBilletera;
  descripcion: string;
  monto: number;
  direccion: DireccionMovimiento;
}

export interface BilleteraResumen {
  alumnoId: string;
  saldoActual: number;
  periodo: PeriodoBilletera;
  montoIngresado: number;
  montoGastado: number;
  balancePeriodo: number;
  cantidadCompras: number;
  gastoPorCategoria: GastoPorCategoria[];
  gastoPorClasificacionSalud: GastoPorClasificacionSalud[];
  movimientos: MovimientoBilletera[];
}
