import { Alumno } from '../models/alumno.model';
import { Perfil } from '../models/perfil.model';
import { CrearHijoRequest } from './alumnos.service';

export interface StudentDTO {
  id: string;
  nombre: string;
  apellido: string;
  grado?: string | null;
  colegioId?: string | null;
  saldo?: number | string | null;
  urlFotoPerfil?: string | null;
}

export class AlumnoMother {
  static crear(override: Partial<Alumno> = {}): Alumno {
    return {
      id: 'alumno-id',
      nombre: 'Nombre',
      apellido: 'Apellido',
      grado: '',
      colegioId: '',
      saldo: 0,
      urlFotoPerfil: null,
      ...override,
    };
  }

  static crearHijoDelTutor(): Alumno {
    return AlumnoMother.crear({
      id: 'alumno-1',
      nombre: 'Julián',
      apellido: 'García',
      grado: '4to Año A',
      colegioId: '1',
      saldo: 2000,
      urlFotoPerfil: null,
    });
  }

  static crearAlumnoActual(): Alumno {
    return {
      id: 'julian-garcia',
      nombre: 'Julián',
      apellido: 'García',
      grado: '4to Año A',
      colegioId: 'instituto-san-jose',
      saldo: 2580,
    };
  }
}

export class PerfilMother {
  static crear(override: Partial<Perfil> = {}): Perfil {
    return {
      id: 'perfil-id',
      email: 'mail@recred.com',
      nombre: 'Nombre',
      apellido: 'Apellido',
      rol: 'ALUMNO',
      ...override,
    };
  }

  static crearAlumnoCon(id: string): Perfil {
    return PerfilMother.crear({ id, nombre: 'Julián', apellido: 'García', rol: 'ALUMNO' });
  }

  static crearTutor(): Perfil {
    return PerfilMother.crear({ id: 'tutor-123', nombre: 'Martín', apellido: 'García', rol: 'PADRE' });
  }
}

export class StudentDtoMother {
  static crear(override: Partial<StudentDTO> = {}): StudentDTO {
    return {
      id: 'a1',
      nombre: 'N',
      apellido: 'A',
      grado: 'g1',
      colegioId: 'c1',
      saldo: 10,
      urlFotoPerfil: null,
      ...override,
    };
  }
}

export class CrearHijoRequestMother {
  static crear(override: Partial<CrearHijoRequest> = {}): CrearHijoRequest {
    return {
      username: 'user',
      nombre: 'Nombre',
      apellido: 'Apellido',
      email: 'mail@recred.com',
      dni: '12345',
      gradoId: 'g1',
      ...override,
    };
  }
}
