export interface IaAnalysis {
  resumen: string;
  alertas: string[];
  recomendaciones: string[];
  modelo: string;
}

export interface SpendingPrediction {
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
  categoriasMasConsumidas: string[];
  analisisIa: IaAnalysis;
}
