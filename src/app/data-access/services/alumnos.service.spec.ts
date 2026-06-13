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
    saldo: 2000
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

  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  describe('cargarHijosDelTutor', () => {
    it('debería hacer un request GET a /tutores/me/hijos', (done) => {
      const mockDtos = [
        { id: 'alumno-1', nombre: 'Julián', apellido: 'García', grado: '4to Año A', colegioId: '1', saldo: 2000 }
      ];

      service.cargarHijosDelTutor().then((alumnos) => {
        expect(alumnos.length).toBe(1);
        expect(alumnos[0]).toEqual(mockAlumnoTutor);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tutores/me/hijos`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDtos);
    });
  });

  describe('asegurarCargados', () => {
    it('debería retornar un array vacío si no hay perfil de usuario', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(null);

      service.asegurarCargados().then((alumnos) => {
        expect(alumnos).toEqual([]);
        done();
      });
    });

    it('debería disparar el request HTTP a /alumnos/me si el rol es ALUMNO', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      service.asegurarCargados().then((alumnos) => {
        expect(alumnos.length).toBe(1);
        expect(alumnos[0].id).toBe('julian-garcia');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/me`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: 'julian-garcia', nombre: 'Julián', apellido: 'García', grado: '4to Año A', colegioId: 'instituto-san-jose', saldo: 2580 });
    });

    it('debería disparar el request HTTP si el rol es PADRE', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilTutor);

      service.asegurarCargados().then((alumnos) => {
        expect(alumnos.length).toBe(1);
        expect(alumnos[0]).toEqual(mockAlumnoTutor);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tutores/me/hijos`);
      expect(req.request.method).toBe('GET');
      req.flush([
        { id: 'alumno-1', nombre: 'Julián', apellido: 'García', grado: '4to Año A', colegioId: '1', saldo: 2000 }
      ]);
    });
  });

  describe('getAlumnos', () => {
    it('debería retornar el alumno mockeado si el rol es ALUMNO', () => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      const alumnos = service.getAlumnos();
      expect(alumnos.length).toBe(1);
      expect(alumnos[0].id).toBe('julian-garcia');
      expect(alumnos[0].nombre).toBe('Julián');
    });

    it('debería retornar un array vacío si el rol es PADRE y no hay alumnos cargados', () => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilTutor);

      const alumnos = service.getAlumnos();
      expect(alumnos).toEqual([]);
    });
  });

  describe('getAlumnoById', () => {
    it('debería retornar el alumno si coincide con el del perfil de ALUMNO', () => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      const alumno = service.getAlumnoById('julian-garcia');
      expect(alumno).toBeDefined();
      expect(alumno?.id).toBe('julian-garcia');
    });

    it('debería retornar undefined si el ID no coincide', () => {
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfilAlumno);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('julian-garcia');

      const alumno = service.getAlumnoById('otro-id');
      expect(alumno).toBeUndefined();
    });
  });
});
