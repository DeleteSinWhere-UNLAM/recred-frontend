import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AlumnosService } from './alumnos.service';
import { PerfilService } from './perfil.service';
import { UsuarioService } from './usuario.service';
import { Alumno } from '../models/alumno.model';
import { Perfil } from '../models/perfil.model';

describe('AlumnosService', () => {
  let service: AlumnosService;
  let httpMock: HttpTestingController;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  const mockAlumnoTutor: Alumno = {
    id: 'alumno-1',
    nombre: 'Julián',
    apellido: 'García',
    grado: '4to Año A',
    colegioId: '1',
    saldo: 2000,
    urlFotoPerfil: null
  };

  const mockAlumnoActual: Alumno = {
    id: 'julian-garcia',
    nombre: 'Julián',
    apellido: 'García',
    grado: '4to Año A',
    colegioId: 'instituto-san-jose',
    saldo: 2580
  };

  const mockPerfilAlumno: Perfil = {
    id: 'julian-garcia',
    email: 'julian@recred.com',
    nombre: 'Julián',
    apellido: 'García',
    rol: 'ALUMNO'
  };

  const mockPerfilTutor: Perfil = {
    id: 'tutor-123',
    email: 'tutor@recred.com',
    nombre: 'Martín',
    apellido: 'García',
    rol: 'PADRE'
  };

  beforeEach(() => {
    const perfilSpy = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
      'obtenerAlumnoId'
    ]);
    const usuarioSpy = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getAlumnoActual'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AlumnosService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: perfilSpy },
        { provide: UsuarioService, useValue: usuarioSpy }
      ]
    });

    service = TestBed.inject(AlumnosService);
    httpMock = TestBed.inject(HttpTestingController);
    perfilServiceSpy = TestBed.inject(PerfilService) as jasmine.SpyObj<PerfilService>;
    usuarioServiceSpy = TestBed.inject(UsuarioService) as jasmine.SpyObj<UsuarioService>;

    usuarioServiceSpy.getAlumnoActual.and.returnValue(mockAlumnoActual);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que se inyecta el servicio, debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('crearHijo', () => {
    it('dado que se llama a crearHijo, debería hacer un POST a /tutores/me/hijos y agregarlo al estado', (done) => {
      const reqPayload = { username: ' user ', nombre: ' N ', apellido: ' A ', email: ' e@e.com ', dni: ' 123 ', gradoId: ' g1 ' };
      const dtoResponse = { id: 'new-1', nombre: 'N', apellido: 'A', grado: 'g1', colegioId: 'c1', saldo: 0, urlFotoPerfil: null };

      service.crearHijo(reqPayload).then(alumno => {
        expect(alumno.id).toBe('new-1');
        expect(service.getAlumnos().some(a => a.id === 'new-1')).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tutores/me/hijos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'user', nombre: 'N', apellido: 'A', email: 'e@e.com', dni: '123', gradoId: 'g1' });
      req.flush(dtoResponse);
    });
  });

  describe('cargarHijosDelTutor', () => {
    it('dado que se llama a cargarHijosDelTutor, debería hacer un request GET a /tutores/me/hijos', (done) => {
      const mockDtos = [
        { id: 'alumno-1', nombre: 'Julián', apellido: 'García', grado: '4to Año A', colegioId: '1', saldo: 2000 }
      ];

      service.cargarHijosDelTutor().then((alumnos) => {
        expect(alumnos.length).toBe(1);
        expect(alumnos[0]).toEqual(mockAlumnoTutor);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl.replace(/\/$/, '')}/tutores/me/hijos`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDtos);
    });

    it('dado que el endpoint devuelve un error o datos inválidos, debería retornar arreglo vacío o rechazar', (done) => {
      service.cargarHijosDelTutor().then((alumnos) => {
        expect(alumnos).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl.replace(/\/$/, '')}/tutores/me/hijos`);
      req.flush(null);
    });
  });

  describe('cargarPerfilAlumno', () => {
    it('dado que se llama a cargarPerfilAlumno y el back responde, debería actualizar el estado', (done) => {
      const dtoResponse = { id: 'a1', nombre: 'N', apellido: 'A', grado: 'g1', colegioId: 'c1', saldo: 10, urlFotoPerfil: null };

      service.cargarPerfilAlumno().then(alumnos => {
        expect(alumnos.length).toBe(1);
        expect(alumnos[0].id).toBe('a1');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl.replace(/\/$/, '')}/alumnos/me`);
      expect(req.request.method).toBe('GET');
      req.flush(dtoResponse);
    });

    it('dado que el back responde null en cargarPerfilAlumno, debería devolver el mock', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      service.cargarPerfilAlumno().then(alumnos => {
        expect(alumnos[0].id).toBe('julian-garcia');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl.replace(/\/$/, '')}/alumnos/me`);
      req.flush(null);
    });

    it('dado que ocurre un error en cargarPerfilAlumno, debería devolver el mock', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      service.cargarPerfilAlumno().then(alumnos => {
        expect(alumnos[0].id).toBe('julian-garcia');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl.replace(/\/$/, '')}/alumnos/me`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('asegurarCargados', () => {
    it('dado que se llama a asegurarCargados y no hay perfil de usuario, debería retornar un array vacío', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(null);

      service.asegurarCargados().then((alumnos) => {
        expect(alumnos).toEqual([]);
        done();
      });
    });

    it('dado que se llama a asegurarCargados y el rol es ALUMNO, debería disparar el request HTTP a /alumnos/me', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      service.asegurarCargados().then((alumnos) => {
        expect(alumnos.length).toBe(1);
        expect(alumnos[0].id).toBe('julian-garcia');
        done();
      });

      httpMock.expectNone(`${environment.apiUrl.replace(/\/$/, '')}/tutores/me/hijos`);
      const req = httpMock.expectOne(`${environment.apiUrl.replace(/\/$/, '')}/alumnos/me`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: 'julian-garcia', nombre: 'Julián', apellido: 'García', grado: '4to Año A', colegioId: 'instituto-san-jose', saldo: 2580 });
    });

    it('dado que se llama a asegurarCargados y el rol es PADRE, debería disparar el request HTTP para hijos', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilTutor);

      service.asegurarCargados().then((alumnos) => {
        expect(alumnos.length).toBe(1);
        expect(alumnos[0]).toEqual(mockAlumnoTutor);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl.replace(/\/$/, '')}/tutores/me/hijos`);
      expect(req.request.method).toBe('GET');
      req.flush([
        { id: 'alumno-1', nombre: 'Julián', apellido: 'García', grado: '4to Año A', colegioId: '1', saldo: 2000 }
      ]);
    });
  });

  describe('getAlumnos', () => {
    it('dado que se llama a getAlumnos y el rol es ALUMNO, debería retornar el alumno mockeado', () => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      const alumnos = service.getAlumnos();
      expect(alumnos.length).toBe(1);
      expect(alumnos[0].id).toBe('julian-garcia');
      expect(alumnos[0].nombre).toBe('Julián');
    });

    it('dado que se llama a getAlumnos, el rol es PADRE y no hay alumnos cargados, debería retornar un array vacío', () => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilTutor);

      const alumnos = service.getAlumnos();
      expect(alumnos).toEqual([]);
    });
  });

  describe('getAlumnoById', () => {
    it('dado que se llama a getAlumnoById y coincide con el del perfil de ALUMNO, debería retornar el alumno', () => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      const alumno = service.getAlumnoById('julian-garcia');
      expect(alumno).toBeDefined();
      expect(alumno?.id).toBe('julian-garcia');
    });

    it('dado que se llama a getAlumnoById y el ID no coincide, debería retornar undefined', () => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      const alumno = service.getAlumnoById('otro-id');
      expect(alumno).toBeUndefined();
    });
  });

  describe('subirFotoAlumno', () => {
    it('dado que se llama a subirFotoAlumno, debería hacer POST y actualizar el estado', (done) => {
      const archivo = new File([''], 'test.png', { type: 'image/png' });
      const dtoResponse = { id: 'alumno-1', nombre: 'Julián', apellido: 'García', grado: '4to Año A', colegioId: '1', saldo: 2000, urlFotoPerfil: 'url.png' };
      
      service['alumnosState'].set([mockAlumnoTutor]);

      service.subirFotoAlumno('alumno-1', archivo).then(alumno => {
        expect(alumno.urlFotoPerfil).toBe('url.png');
        expect(service.getAlumnoById('alumno-1')?.urlFotoPerfil).toBe('url.png');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tutores/me/hijos/alumno-1/foto`);
      expect(req.request.method).toBe('POST');
      req.flush(dtoResponse);
    });
  });
});
