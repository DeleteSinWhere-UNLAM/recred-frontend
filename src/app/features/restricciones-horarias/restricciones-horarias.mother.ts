import { CategoriaProducto } from '../buffet/models/producto.model';
import { ClasificacionSaludBackend } from '../restricciones-nutricionales/services/restricciones-nutricionales.service';
import {
  RestriccionHoraria,
  TimeRestrictionCommand,
  TimeSlot,
} from './models/restriccion-horaria.model';
import { FranjaConRestricciones } from './presenter/restricciones-horarias.presenter';

export const ALUMNO_ID_TEST = 'alumno-42';
export const COLEGIO_ID_TEST = 'colegio-1';

export class TimeSlotMother {
  static crear(override: Partial<TimeSlot> = {}): TimeSlot {
    return {
      id: 'ts-001',
      colegioId: COLEGIO_ID_TEST,
      descripcion: 'Primer recreo',
      horaInicio: '09:30',
      horaFin: '09:50',
      activo: true,
      ...override,
    };
  }

  static crearSegundo(): TimeSlot {
    return TimeSlotMother.crear({
      id: 'ts-002',
      descripcion: 'Segundo recreo',
      horaInicio: '11:00',
      horaFin: '11:20',
    });
  }

  static crearVarios(): TimeSlot[] {
    return [TimeSlotMother.crear(), TimeSlotMother.crearSegundo()];
  }
}

export class RestriccionHorariaMother {
  static crear(override: Partial<RestriccionHoraria> = {}): RestriccionHoraria {
    return {
      id: 'restriccion-1',
      studentId: ALUMNO_ID_TEST,
      timeSlotId: 'ts-001',
      categoryId: null,
      classificationId: null,
      activa: true,
      ...override,
    };
  }

  static crearPorCategoria(override: Partial<RestriccionHoraria> = {}): RestriccionHoraria {
    return RestriccionHorariaMother.crear({
      id: 'restriccion-cat',
      categoryId: 'cat-bebidas',
      categoria: { id: 'cat-bebidas', descripcion: 'Bebidas' },
      ...override,
    });
  }

  static crearPorSalud(override: Partial<RestriccionHoraria> = {}): RestriccionHoraria {
    return RestriccionHorariaMother.crear({
      id: 'restriccion-salud',
      classificationId: 'salud-tacc',
      clasificacionSalud: { id: 'salud-tacc', descripcion: 'Sin TACC' },
      ...override,
    });
  }

  static crearBloqueoTotal(override: Partial<RestriccionHoraria> = {}): RestriccionHoraria {
    return RestriccionHorariaMother.crear({
      id: 'restriccion-total',
      timeSlotId: 'ts-001',
      categoryId: null,
      classificationId: null,
      ...override,
    });
  }
}

export class TimeRestrictionCommandMother {
  static crear(override: Partial<TimeRestrictionCommand> = {}): TimeRestrictionCommand {
    return {
      studentId: ALUMNO_ID_TEST,
      timeSlotId: 'ts-001',
      categoryId: null,
      classificationId: null,
      ...override,
    };
  }
}

export class CategoriaProductoMother {
  static crear(override: Partial<CategoriaProducto> = {}): CategoriaProducto {
    return {
      id: 'cat-bebidas',
      descripcion: 'Bebidas',
      ...override,
    };
  }

  static crearVarias(): CategoriaProducto[] {
    return [
      CategoriaProductoMother.crear(),
      CategoriaProductoMother.crear({ id: 'cat-snacks', descripcion: 'Snacks' }),
      CategoriaProductoMother.crear({ id: 'cat-golosinas', descripcion: 'Golosinas' }),
    ];
  }
}

export class ClasificacionSaludBackendMother {
  static crear(override: Partial<ClasificacionSaludBackend> = {}): ClasificacionSaludBackend {
    return {
      id: 'salud-tacc',
      descripcion: 'Sin TACC',
      activo: true,
      ...override,
    };
  }

  static crearVarias(): ClasificacionSaludBackend[] {
    return [
      ClasificacionSaludBackendMother.crear(),
      ClasificacionSaludBackendMother.crear({ id: 'salud-azucar', descripcion: 'Sin Azúcar' }),
      ClasificacionSaludBackendMother.crear({ id: 'salud-sodio', descripcion: 'Sin Sodio' }),
    ];
  }
}

export class FranjaConRestriccionesMother {
  static crear(override: Partial<FranjaConRestricciones> = {}): FranjaConRestricciones {
    return {
      franja: TimeSlotMother.crear(),
      restricciones: [],
      categoriasDisponibles: CategoriaProductoMother.crearVarias(),
      saludDisponible: ClasificacionSaludBackendMother.crearVarias(),
      tieneBloqueoTotal: false,
      ...override,
    };
  }
}
