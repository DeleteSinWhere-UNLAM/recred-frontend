import { AnalisisIa } from './models/analisis-ia.interface';
import {
  CategoriaMasConsumida,
  PrediccionGasto,
} from './models/prediccion-gasto.interface';

export const ALUMNO_ID_TEST = 'alumno-1';

export class CategoriaMasConsumidaMother {
  static crear(override: Partial<CategoriaMasConsumida> = {}): CategoriaMasConsumida {
    return {
      descripcion: 'Bebidas',
      montoTotal: 1500,
      ...override,
    };
  }
}

export class AnalisisIaMother {
  static crear(override: Partial<AnalisisIa> = {}): AnalisisIa {
    return {
      resumen: 'Estas dentro del presupuesto.',
      alertas: [],
      recomendaciones: ['Mantener el ritmo'],
      modelo: 'gpt-4o-mini',
      ...override,
    };
  }

  static crearConAlertas(): AnalisisIa {
    return AnalisisIaMother.crear({
      resumen: 'Cerca del limite.',
      alertas: ['Categoria Golosinas supera el 60%'],
      recomendaciones: ['Reducir compras de bebidas azucaradas'],
    });
  }

  static crearVacio(): AnalisisIa {
    return AnalisisIaMother.crear({ alertas: [], recomendaciones: [] });
  }
}

export class PrediccionGastoMother {
  static crear(override: Partial<PrediccionGasto> = {}): PrediccionGasto {
    return {
      periodo: 'SEMANAL',
      fechaCalculo: '2026-07-01',
      fechaInicio: '2026-06-30',
      fechaFin: '2026-07-06',
      gastoActual: 3000,
      gastoPredicho: 4500,
      promedioGastoDiario: 500,
      montoLimite: 6000,
      porcentajePresupuesto: 0.5,
      confianza: 0.8,
      diasHistoricosUsados: 20,
      diasRestantes: 3,
      categoriasMasConsumidas: [
        CategoriaMasConsumidaMother.crear(),
        CategoriaMasConsumidaMother.crear({ descripcion: 'Snacks', montoTotal: 800 }),
      ],
      analisisIa: AnalisisIaMother.crear(),
      ...override,
    };
  }

  static crearCercaDelLimite(): PrediccionGasto {
    return PrediccionGastoMother.crear({
      porcentajePresupuesto: 0.85,
      analisisIa: AnalisisIaMother.crearConAlertas(),
    });
  }

  static crearSinLimite(): PrediccionGasto {
    return PrediccionGastoMother.crear({ montoLimite: null, porcentajePresupuesto: null });
  }
}
