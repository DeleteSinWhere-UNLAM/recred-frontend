export type Periodo = 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';

export const PERIODO_LABELS: Record<Periodo, string> = {
  DIARIO: 'Diario',
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
};

export const PERIODOS: readonly Periodo[] = [
  'DIARIO',
  'SEMANAL',
  'QUINCENAL',
  'MENSUAL',
] as const;

export interface ReglaCategoria {
  id: string;
  categoriaId: string;
  descripcionCategoria: string;
  porcentajeLimite: number;
  montoLimiteCalculado: number;
  activo: boolean;
}

export interface Presupuesto {
  id: string;
  alumnoId: string;
  montoLimiteGeneral: number;
  periodo: Periodo;
  fechaInicio: string;
  activo: boolean;
  reglasCategoria: ReglaCategoria[];
}

export interface CategoriaConsumida {
  descripcion: string;
  montoTotal: number;
}

export interface PrediccionGasto {
  alumnoId: string;
  periodo: Periodo;
  gastoActual: number;
  gastoPredicho: number;
  promedioGastoDiario: number;
  montoLimite: number;
  porcentajePresupuesto: number;
  confianza: number;
  diasRestantes: number;
  categoriasMasConsumidas: CategoriaConsumida[];
  resumenIa: string;
  alertas: string[];
  recomendaciones: string[];
}

export type NivelAlerta = 'ok' | 'warning' | 'excedido';

export function nivelAlertaDePorcentaje(porcentaje: number): NivelAlerta {
  if (porcentaje >= 100) return 'excedido';
  if (porcentaje >= 70) return 'warning';
  return 'ok';
}

export function sumaPorcentajes(reglas: readonly ReglaCategoria[]): number {
  return reglas
    .filter((r) => r.activo)
    .reduce((acc, r) => acc + r.porcentajeLimite, 0);
}

export function recalcularMontosReglas(presupuesto: Presupuesto): Presupuesto {
  return {
    ...presupuesto,
    reglasCategoria: presupuesto.reglasCategoria.map((regla) => ({
      ...regla,
      montoLimiteCalculado: redondear(
        (presupuesto.montoLimiteGeneral * regla.porcentajeLimite) / 100,
      ),
    })),
  };
}

export function presupuestoPorDefecto(alumnoId: string): Presupuesto {
  return {
    id: '',
    alumnoId,
    montoLimiteGeneral: 0,
    periodo: 'MENSUAL',
    fechaInicio: hoyISO(),
    activo: false,
    reglasCategoria: [],
  };
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}
