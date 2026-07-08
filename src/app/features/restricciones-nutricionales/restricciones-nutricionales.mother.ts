import { RestriccionesNutricionales } from './models/restricciones-nutricionales.model';
import { ClasificacionSaludBackend } from './services/restricciones-nutricionales.service';

export const ALUMNO_ID_TEST = 'alumno-42';

export class ClasificacionSaludBackendMother {
  static crear(override: Partial<ClasificacionSaludBackend> = {}): ClasificacionSaludBackend {
    return {
      id: 'uuid-tacc',
      descripcion: 'Sin TACC',
      activo: true,
      ...override,
    };
  }

  static crearCatalogoCompleto(): ClasificacionSaludBackend[] {
    return [
      ClasificacionSaludBackendMother.crear(),
      ClasificacionSaludBackendMother.crear({ id: 'uuid-azucar', descripcion: 'Sin Azúcar' }),
      ClasificacionSaludBackendMother.crear({ id: 'uuid-sodio', descripcion: 'Sin Sodio' }),
      ClasificacionSaludBackendMother.crear({ id: 'uuid-vegano', descripcion: 'Apto Vegano' }),
      ClasificacionSaludBackendMother.crear({ id: 'uuid-lacteos', descripcion: 'Contiene Lácteos' }),
    ];
  }

  static crearInactiva(override: Partial<ClasificacionSaludBackend> = {}): ClasificacionSaludBackend {
    return ClasificacionSaludBackendMother.crear({
      id: 'uuid-inactivo',
      descripcion: 'Sin TACC obsoleta',
      activo: false,
      ...override,
    });
  }
}

export class RestriccionesNutricionalesMother {
  static crear(override: Partial<RestriccionesNutricionales> = {}): RestriccionesNutricionales {
    return {
      sinTacc: false,
      sinAzucar: false,
      sinSodio: false,
      vegano: false,
      contieneLacteos: false,
      tieneMani: false,
      contieneHuevo: false,
      contienePescado: false,
      contieneSoja: false,
      aptoVegetariano: false,
      ...override,
    };
  }
}
