import {
  CategoriaConsumida,
  PrediccionGasto,
} from '../presupuesto/models/presupuesto.model';

export class CategoriaConsumidaMother {
  static crear(override: Partial<CategoriaConsumida> = {}): CategoriaConsumida {
    return {
      descripcion: 'Bebidas',
      montoTotal: 1500,
      ...override,
    };
  }
}

export class PrediccionGastoMother {
  static crear(override: Partial<PrediccionGasto> = {}): PrediccionGasto {
    return {
      alumnoId: 'alumno-1',
      periodo: 'SEMANAL',
      gastoActual: 3000,
      gastoPredicho: 4500,
      promedioGastoDiario: 500,
      montoLimite: 6000,
      porcentajePresupuesto: 50,
      confianza: 0.8,
      diasRestantes: 3,
      categoriasMasConsumidas: [
        CategoriaConsumidaMother.crear(),
        CategoriaConsumidaMother.crear({ descripcion: 'Snacks', montoTotal: 800 }),
      ],
      resumenIa: 'Consumo estable, dentro del limite.',
      alertas: [],
      recomendaciones: ['Mantener el ritmo actual'],
      ...override,
    };
  }

  static crearWarning(): PrediccionGasto {
    return PrediccionGastoMother.crear({
      porcentajePresupuesto: 80,
      alertas: ['Estas cerca del limite'],
      resumenIa: 'Cerca del limite del presupuesto.',
    });
  }

  static crearExcedido(): PrediccionGasto {
    return PrediccionGastoMother.crear({
      porcentajePresupuesto: 120,
      gastoActual: 5000,
      gastoPredicho: 7200,
      alertas: ['Excede el presupuesto', 'Revisar categorias'],
      resumenIa: 'Vas a superar el limite del periodo.',
    });
  }

  static crearSinCategorias(): PrediccionGasto {
    return PrediccionGastoMother.crear({
      categoriasMasConsumidas: [],
      alertas: [],
      recomendaciones: [],
    });
  }
}
