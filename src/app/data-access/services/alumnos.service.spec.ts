import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AlumnosService, CrearHijoRequest } from './alumnos.service';
import { PerfilService } from './perfil.service';
import { UsuarioService } from './usuario.service';
import { Alumno } from '../models/alumno.model';
import { Perfil } from '../models/perfil.model';

interface StudentDTO {
  id: string;
  nombre: string;
  apellido: string;
  grado?: string | null;
  colegioId?: string | null;
  saldo?: number | string | null;
  urlFotoPerfil?: string | null;
}

describe('AlumnosService', () => {
  let service: AlumnosService;
  let httpMock: HttpTestingController;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  const API = environment.apiUrl;
  const API_NORM = environment.apiUrl.replace(/\/$/, '');
  const URL_HIJOS_TUTOR_POST = `${API}/tutores/me/hijos`;
  const URL_HIJOS_TUTOR_GET = `${API_NORM}/tutores/me/hijos`;
  const URL_PERFIL_ALUMNO = `${API_NORM}/alumnos/me`;
  const urlFotoAlumno = (id: string) => `${API}/tutores/me/hijos/${id}/foto`;

  beforeEach(() => {
    perfilServiceSpy = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
      'obtenerAlumnoId',
    ]);
    usuarioServiceSpy = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getAlumnoActual',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AlumnosService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
      ],
    });

    service = TestBed.inject(AlumnosService);
    httpMock = TestBed.inject(HttpTestingController);

    usuarioServiceSpy.getAlumnoActual.and.returnValue(AlumnoMother.alumnoActual());
  });

  afterEach(() => httpMock.verify());

  it('dado que se inyecta el servicio, deberia crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('crearHijo', () => {
    it('dado un payload con espacios alrededor de los campos, cuando creo un hijo, deberia hacer POST con el body trimmeado y agregar el alumno al estado', async () => {
      const payloadConEspacios = CrearHijoRequestMother.create({
        username: ' user ',
        nombre: ' N ',
        apellido: ' A ',
        email: ' e@e.com ',
        dni: ' 123 ',
        gradoId: ' g1 ',
      });
      const dtoRespuesta = StudentDtoMother.create({ id: 'new-1' });

      const promesa = whenCreoUnHijo(payloadConEspacios);

      thenSeHizoPostHijosConBody({
        username: 'user',
        nombre: 'N',
        apellido: 'A',
        email: 'e@e.com',
        dni: '123',
        gradoId: 'g1',
      }).flush(dtoRespuesta);

      const alumno = await promesa;
      expect(alumno.id).toBe('new-1');
      thenElEstadoContieneAlumnoConId('new-1');
    });
  });

  describe('cargarHijosDelTutor', () => {
    it('cuando cargo los hijos del tutor, deberia hacer GET a /tutores/me/hijos y mapear los DTO a Alumno', async () => {
      const dto = StudentDtoMother.create({
        id: 'alumno-1',
        nombre: 'Julián',
        apellido: 'García',
        grado: '4to Año A',
        colegioId: '1',
        saldo: 2000,
      });

      const promesa = whenCargoHijosDelTutor();

      thenSeHizoGetHijos().flush([dto]);

      const alumnos = await promesa;
      expect(alumnos.length).toBe(1);
      expect(alumnos[0]).toEqual(AlumnoMother.hijoDelTutor());
    });

    it('dado que el endpoint devuelve null, cuando cargo los hijos del tutor, deberia retornar arreglo vacio', async () => {
      spyOn(console, 'warn');

      const promesa = whenCargoHijosDelTutor();

      thenSeHizoGetHijos().flush(null);
      const alumnos = await promesa;
      expect(alumnos).toEqual([]);
    });
  });

  describe('cargarPerfilAlumno', () => {
    it('cuando cargo el perfil del alumno y el back responde, deberia mapearlo y guardarlo en el estado', async () => {
      const dto = StudentDtoMother.create({ id: 'a1' });

      const promesa = whenCargoPerfilAlumno();

      thenSeHizoGetPerfilAlumno().flush(dto);
      const alumnos = await promesa;
      expect(alumnos.length).toBe(1);
      expect(alumnos[0].id).toBe('a1');
    });

    it('dado que el back responde null y hay perfil ALUMNO, cuando cargo el perfil, deberia devolver el mock con el id del perfil', async () => {
      givenPerfilDeAlumnoCon('julian-garcia');

      const promesa = whenCargoPerfilAlumno();

      thenSeHizoGetPerfilAlumno().flush(null);
      const alumnos = await promesa;
      expect(alumnos[0].id).toBe('julian-garcia');
    });

    it('dado que el back falla y hay perfil ALUMNO, cuando cargo el perfil, deberia devolver el mock', async () => {
      spyOn(console, 'error');
      givenPerfilDeAlumnoCon('julian-garcia');

      const promesa = whenCargoPerfilAlumno();

      thenSeHizoGetPerfilAlumno().error(new ProgressEvent('error'));
      const alumnos = await promesa;
      expect(alumnos[0].id).toBe('julian-garcia');
    });
  });

  describe('asegurarCargados', () => {
    it('dado que no hay perfil de usuario, cuando aseguro cargados, deberia retornar arreglo vacio', async () => {
      givenSinPerfil();

      const alumnos = await service.asegurarCargados();

      expect(alumnos).toEqual([]);
    });

    it('dado un perfil con rol ALUMNO, cuando aseguro cargados, deberia hacer GET solo a /alumnos/me', async () => {
      givenPerfilDeAlumnoCon('julian-garcia');

      const promesa = service.asegurarCargados();

      thenNoSeHizoGetHijos();
      thenSeHizoGetPerfilAlumno().flush(
        StudentDtoMother.create({ id: 'julian-garcia', nombre: 'Julián', apellido: 'García' }),
      );

      const alumnos = await promesa;
      expect(alumnos.length).toBe(1);
      expect(alumnos[0].id).toBe('julian-garcia');
    });

    it('dado un perfil con rol PADRE, cuando aseguro cargados, deberia hacer GET a /tutores/me/hijos', async () => {
      givenPerfilDeTutor();

      const promesa = service.asegurarCargados();

      thenSeHizoGetHijos().flush([
        StudentDtoMother.create({
          id: 'alumno-1',
          nombre: 'Julián',
          apellido: 'García',
          grado: '4to Año A',
          colegioId: '1',
          saldo: 2000,
        }),
      ]);

      const alumnos = await promesa;
      expect(alumnos.length).toBe(1);
      expect(alumnos[0]).toEqual(AlumnoMother.hijoDelTutor());
    });
  });

  describe('getAlumnos', () => {
    it('dado un perfil ALUMNO y sin alumnos cargados, cuando obtengo los alumnos, deberia devolver el mock', () => {
      givenPerfilDeAlumnoCon('julian-garcia');

      const alumnos = service.getAlumnos();

      expect(alumnos.length).toBe(1);
      expect(alumnos[0].id).toBe('julian-garcia');
      expect(alumnos[0].nombre).toBe('Julián');
    });

    it('dado un perfil PADRE sin alumnos cargados, cuando obtengo los alumnos, deberia devolver arreglo vacio', () => {
      givenPerfilDeTutor();

      const alumnos = service.getAlumnos();

      expect(alumnos).toEqual([]);
    });
  });

  describe('getAlumnoById', () => {
    it('dado un perfil ALUMNO, cuando busco por el id del perfil, deberia retornar el alumno', () => {
      givenPerfilDeAlumnoCon('julian-garcia');

      const alumno = service.getAlumnoById('julian-garcia');

      expect(alumno?.id).toBe('julian-garcia');
    });

    it('dado un perfil ALUMNO, cuando busco por un id que no coincide, deberia retornar undefined', () => {
      givenPerfilDeAlumnoCon('julian-garcia');

      const alumno = service.getAlumnoById('otro-id');

      expect(alumno).toBeUndefined();
    });
  });

  describe('subirFotoAlumno', () => {
    it('dado un alumno ya en el estado, cuando subo su foto, deberia hacer POST y actualizar la urlFotoPerfil', async () => {
      givenAlumnoEnEstado(AlumnoMother.hijoDelTutor());
      const dto = StudentDtoMother.create({
        id: 'alumno-1',
        nombre: 'Julián',
        apellido: 'García',
        grado: '4to Año A',
        colegioId: '1',
        saldo: 2000,
        urlFotoPerfil: 'url.png',
      });

      const promesa = service.subirFotoAlumno('alumno-1', unArchivoPng());

      thenSeHizoPostFotoDeAlumno('alumno-1').flush(dto);
      const alumno = await promesa;
      expect(alumno.urlFotoPerfil).toBe('url.png');
      expect(service.getAlumnoById('alumno-1')?.urlFotoPerfil).toBe('url.png');
    });
  });

  const AlumnoMother = {
    create(overrides: Partial<Alumno> = {}): Alumno {
      return {
        id: 'alumno-id',
        nombre: 'Nombre',
        apellido: 'Apellido',
        grado: '',
        colegioId: '',
        saldo: 0,
        urlFotoPerfil: null,
        ...overrides,
      };
    },
    hijoDelTutor(): Alumno {
      return this.create({
        id: 'alumno-1',
        nombre: 'Julián',
        apellido: 'García',
        grado: '4to Año A',
        colegioId: '1',
        saldo: 2000,
        urlFotoPerfil: null,
      });
    },
    alumnoActual(): Alumno {
      return {
        id: 'julian-garcia',
        nombre: 'Julián',
        apellido: 'García',
        grado: '4to Año A',
        colegioId: 'instituto-san-jose',
        saldo: 2580,
      };
    },
  };

  const PerfilMother = {
    create(overrides: Partial<Perfil> = {}): Perfil {
      return {
        id: 'perfil-id',
        email: 'mail@recred.com',
        nombre: 'Nombre',
        apellido: 'Apellido',
        rol: 'ALUMNO',
        ...overrides,
      };
    },
    alumnoCon(id: string): Perfil {
      return this.create({ id, nombre: 'Julián', apellido: 'García', rol: 'ALUMNO' });
    },
    tutor(): Perfil {
      return this.create({ id: 'tutor-123', nombre: 'Martín', apellido: 'García', rol: 'PADRE' });
    },
  };

  const StudentDtoMother = {
    create(overrides: Partial<StudentDTO> = {}): StudentDTO {
      return {
        id: 'a1',
        nombre: 'N',
        apellido: 'A',
        grado: 'g1',
        colegioId: 'c1',
        saldo: 10,
        urlFotoPerfil: null,
        ...overrides,
      };
    },
  };

  const CrearHijoRequestMother = {
    create(overrides: Partial<CrearHijoRequest> = {}): CrearHijoRequest {
      return {
        username: 'user',
        nombre: 'Nombre',
        apellido: 'Apellido',
        email: 'mail@recred.com',
        dni: '12345',
        gradoId: 'g1',
        ...overrides,
      };
    },
  };

  function unArchivoPng(): File {
    return new File([''], 'test.png', { type: 'image/png' });
  }

  function givenPerfilDeAlumnoCon(id: string): void {
    perfilServiceSpy.getPerfil.and.returnValue(PerfilMother.alumnoCon(id));
    perfilServiceSpy.obtenerAlumnoId.and.returnValue(id);
  }

  function givenPerfilDeTutor(): void {
    perfilServiceSpy.getPerfil.and.returnValue(PerfilMother.tutor());
  }

  function givenSinPerfil(): void {
    perfilServiceSpy.getPerfil.and.returnValue(null);
  }

  function givenAlumnoEnEstado(alumno: Alumno): void {
    (service as unknown as { alumnosState: { set: (a: Alumno[]) => void } }).alumnosState.set([
      alumno,
    ]);
  }

  function whenCreoUnHijo(payload: CrearHijoRequest): Promise<Alumno> {
    return service.crearHijo(payload);
  }

  function whenCargoHijosDelTutor(): Promise<Alumno[]> {
    return service.cargarHijosDelTutor();
  }

  function whenCargoPerfilAlumno(): Promise<Alumno[]> {
    return service.cargarPerfilAlumno();
  }

  function thenSeHizoPostHijosConBody(body: CrearHijoRequest): TestRequest {
    const req = httpMock.expectOne(URL_HIJOS_TUTOR_POST);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    return req;
  }

  function thenSeHizoGetHijos(): TestRequest {
    const req = httpMock.expectOne(URL_HIJOS_TUTOR_GET);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenNoSeHizoGetHijos(): void {
    httpMock.expectNone(URL_HIJOS_TUTOR_GET);
  }

  function thenSeHizoGetPerfilAlumno(): TestRequest {
    const req = httpMock.expectOne(URL_PERFIL_ALUMNO);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoPostFotoDeAlumno(alumnoId: string): TestRequest {
    const req = httpMock.expectOne(urlFotoAlumno(alumnoId));
    expect(req.request.method).toBe('POST');
    return req;
  }

  function thenElEstadoContieneAlumnoConId(id: string): void {
    expect(service.getAlumnos().some((a) => a.id === id)).toBeTrue();
  }
});
