import { CategoriaProducto } from '../buffet/models/producto.model';
import {
  PrediccionGasto,
  Presupuesto,
  ReglaCategoria,
} from './models/presupuesto.model';

export const ALUMNO_ID_TEST = 'alumno-1';
export const PRESUPUESTO_ID_TEST = 'pres-1';

export class ReglaCategoriaMother {
  static crear(override: Partial<ReglaCategoria> = {}): ReglaCategoria {
    return {
      id: 'r-1',
      categoriaId: 'cat-bebidas',
      descripcionCategoria: 'Bebidas',
      porcentajeLimite: 40,
      montoLimiteCalculado: 2000,
      activo: true,
      ...override,
    };
  }

  static crearLacteos(override: Partial<ReglaCategoria> = {}): ReglaCategoria {
    return ReglaCategoriaMother.crear({
      id: 'r-2',
      categoriaId: 'cat-lacteos',
      descripcionCategoria: 'Lácteos',
      porcentajeLimite: 30,
      montoLimiteCalculado: 1500,
      ...override,
    });
  }

  static crearInactiva(): ReglaCategoria {
    return ReglaCategoriaMother.crear({
      id: 'r-inactiva',
      activo: false,
      porcentajeLimite: 20,
    });
  }
}

export class CategoriaProductoMother {
  static crear(override: Partial<CategoriaProducto> = {}): CategoriaProducto {
    return {
      id: 'cat-bebidas',
      descripcion: 'Bebidas e Infusiones',
      ...override,
    };
  }

  static crearVarias(): CategoriaProducto[] {
    return [
      { id: 'cat-bebidas', descripcion: 'Bebidas e Infusiones' },
      { id: 'cat-lacteos', descripcion: 'Lácteos' },
      { id: 'cat-viandas', descripcion: 'Viandas y Platos' },
    ];
  }
}

export class PresupuestoMother {
  static crear(override: Partial<Presupuesto> = {}): Presupuesto {
    return {
      id: PRESUPUESTO_ID_TEST,
      alumnoId: ALUMNO_ID_TEST,
      montoLimiteGeneral: 5000,
      periodo: 'MENSUAL',
      fechaInicio: '2026-06-01',
      activo: true,
      reglasCategoria: [ReglaCategoriaMother.crear()],
      ...override,
    };
  }

  static crearVacio(alumnoId = ALUMNO_ID_TEST): Presupuesto {
    return PresupuestoMother.crear({
      id: '',
      alumnoId,
      montoLimiteGeneral: 4000,
      activo: false,
      reglasCategoria: [],
    });
  }

  static crearConMultiplesReglas(): Presupuesto {
    return PresupuestoMother.crear({
      montoLimiteGeneral: 10000,
      reglasCategoria: [
        ReglaCategoriaMother.crear({ porcentajeLimite: 40, montoLimiteCalculado: 4000 }),
        ReglaCategoriaMother.crearLacteos({ porcentajeLimite: 30, montoLimiteCalculado: 3000 }),
      ],
    });
  }
}

export class PrediccionGastoPresupuestoMother {
  static crear(override: Partial<PrediccionGasto> = {}): PrediccionGasto {
    return {
      alumnoId: ALUMNO_ID_TEST,
      periodo: 'MENSUAL',
      gastoActual: 1500,
      gastoPredicho: 3000,
      promedioGastoDiario: 100,
      montoLimite: 5000,
      porcentajePresupuesto: 60,
      confianza: 0.8,
      diasRestantes: 10,
      categoriasMasConsumidas: [],
      resumenIa: '',
      alertas: [],
      recomendaciones: [],
      ...override,
    };
  }

  static crearWarning(): PrediccionGasto {
    return PrediccionGastoPresupuestoMother.crear({ porcentajePresupuesto: 80 });
  }

  static crearExcedido(): PrediccionGasto {
    return PrediccionGastoPresupuestoMother.crear({ porcentajePresupuesto: 110 });
  }
}
