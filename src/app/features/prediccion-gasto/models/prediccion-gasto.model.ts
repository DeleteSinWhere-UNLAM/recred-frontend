import { AnalisisIa } from './analisis-ia.model';

export interface CategoriaMasConsumida {
  descripcion: string;
  montoTotal: number;
}

export interface PrediccionGasto {
  periodo: string;
  fechaCalculo: string;
  fechaInicio: string;
  fechaFin: string;
  gastoActual: number;
  gastoPredicho: number;
  promedioGastoDiario: number;
  montoLimite: number | null;
  porcentajePresupuesto: number | null;
  confianza: number;
  diasHistoricosUsados: number;
  diasRestantes: number;
  categoriasMasConsumidas: CategoriaMasConsumida[];
  analisisIa: AnalisisIa;
}
