import { Alumno } from '../../data-access/models/alumno.model';
import { Colegio } from '../../data-access/models/colegio.model';
import { Grado } from '../../data-access/models/grado.model';
import { CrearHijoRequest } from '../../data-access/services/alumnos.service';

export class ColegioMother {
  static crear(override: Partial<Colegio> = {}): Colegio {
    return {
      id: 'colegio-1',
      nombre: 'Instituto San José',
      ...override,
    };
  }

  static crearLista(): Colegio[] {
    return [
      ColegioMother.crear(),
      ColegioMother.crear({ id: 'colegio-2', nombre: 'Colegio Santa María' }),
    ];
  }
}

export class GradoMother {
  static crear(override: Partial<Grado> = {}): Grado {
    return {
      id: 'grado-1',
      nombre: '5to A',
      ...override,
    };
  }

  static crearLista(): Grado[] {
    return [
      GradoMother.crear(),
      GradoMother.crear({ id: 'grado-2', nombre: '6to B' }),
    ];
  }
}

export class AlumnoNuevoMother {
  static crear(override: Partial<Alumno> = {}): Alumno {
    return {
      id: 'alumno-nuevo',
      nombre: 'Juan',
      apellido: 'Pérez',
      grado: '5to A',
      colegioId: 'colegio-1',
      saldo: 0,
      ...override,
    };
  }
}

export class CrearHijoFormMother {
  static crear(override: Partial<CrearHijoRequest> = {}): CrearHijoRequest {
    return {
      nombre: 'Juan',
      apellido: 'Pérez',
      username: 'juan.perez',
      email: 'juan.perez@example.com',
      dni: '40123456',
      gradoId: 'grado-1',
      ...override,
    };
  }
}
