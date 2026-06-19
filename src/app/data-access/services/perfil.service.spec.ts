import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PerfilService } from './perfil.service';
import { AuthSessionService } from '../../core/auth/services/auth-session.service';
import { environment } from '../../../environments/environment';
import { Perfil } from '../models/perfil.model';

describe('PerfilService', () => {
  let service: PerfilService;
  let httpMock: HttpTestingController;
  let authSessionServiceSpy: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthSessionService', ['obtenerAtributosUsuario']);
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        PerfilService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: spy }
      ]
    });

    service = TestBed.inject(PerfilService);
    httpMock = TestBed.inject(HttpTestingController);
    authSessionServiceSpy = TestBed.inject(AuthSessionService) as jasmine.SpyObj<AuthSessionService>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('cargarPerfil', () => {
    it('dado que no hay peticion en curso, deberia obtener atributos, llamar a sync y guardar el perfil', fakeAsync(() => {
      const mockAttrs = { email: 'test@test.com', nombre: 'Test', apellido: 'User' };
      authSessionServiceSpy.obtenerAtributosUsuario.and.returnValue(Promise.resolve(mockAttrs));
      const mockResponse: Perfil = { id: '1', email: 'test@test.com', nombre: 'Test', apellido: 'User', rol: 'PADRE' };

      let result: Perfil | undefined;
      service.cargarPerfil().then(res => result = res);
      flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/sync`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockAttrs);
      req.flush(mockResponse);
      flushMicrotasks();

      expect(result).toEqual(mockResponse);
      expect(service.getPerfil()).toEqual(mockResponse);
      expect(localStorage.getItem('recred.perfil')).toBeTruthy();
    }));

    it('dado que ya hay una peticion en curso, deberia retornar la misma promesa sin hacer otra llamada', fakeAsync(() => {
      authSessionServiceSpy.obtenerAtributosUsuario.and.returnValue(Promise.resolve({ email: 'a@a.com', nombre: 'A', apellido: 'B' }));
      const mockResponse: Perfil = { id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'ALUMNO' };

      const promise1 = service.cargarPerfil();
      const promise2 = service.cargarPerfil();
      flushMicrotasks();



      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/sync`);
      req.flush(mockResponse);
      flushMicrotasks();

      let res1: Perfil | undefined;
      let res2: Perfil | undefined;
      promise1.then(r => res1 = r);
      promise2.then(r => res2 = r);
      flushMicrotasks();

      expect(res1).toEqual(mockResponse);
      expect(res2).toEqual(mockResponse);
    }));

    it('dado que la red devuelve un error generico, deberia propagarlo', fakeAsync(() => {
      authSessionServiceSpy.obtenerAtributosUsuario.and.returnValue(Promise.resolve({ email: 'a@a.com', nombre: 'A', apellido: 'B' }));
      spyOn(console, 'error');

      let caughtError: import('@angular/common/http').HttpErrorResponse | Error | undefined | { name: string };
      service.cargarPerfil().catch(err => caughtError = err);
      flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/sync`);
      req.error(new ProgressEvent('error'));
      flushMicrotasks();

      expect(caughtError).toBeTruthy();
      expect(console.error).toHaveBeenCalled();
    }));

    it('dado que el rol es PENDIENTE, deberia lanzar UsuarioSinPerfilError', fakeAsync(() => {
      authSessionServiceSpy.obtenerAtributosUsuario.and.returnValue(Promise.resolve({ email: 'a@a.com', nombre: 'A', apellido: 'B' }));
      const mockResponse: Perfil = { id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'PENDIENTE' as unknown as import('../models/perfil.model').RolUsuario };

      let caughtError: import('@angular/common/http').HttpErrorResponse | Error | undefined | { name: string };
      service.cargarPerfil().catch(err => caughtError = err);
      flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/sync`);
      req.flush(mockResponse);
      flushMicrotasks();

      expect(caughtError!.name).toBe('UsuarioSinPerfilError');
    }));

    it('dado que se limpia el servicio antes de terminar la peticion, no deberia guardar el perfil', fakeAsync(() => {
      authSessionServiceSpy.obtenerAtributosUsuario.and.returnValue(Promise.resolve({ email: 'a@a.com', nombre: 'A', apellido: 'B' }));
      const mockResponse: Perfil = { id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'PADRE' };

      service.cargarPerfil();
      flushMicrotasks();
      
      service.limpiar();

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/sync`);
      req.flush(mockResponse);
      flushMicrotasks();

      expect(service.getPerfil()).toBeNull();
      expect(localStorage.getItem('recred.perfil')).toBeNull();
    }));
  });

  describe('asegurarPerfil', () => {
    it('dado que ya existe un perfil activo, deberia retornarlo inmediatamente', fakeAsync(() => {
      const mockResponse: Perfil = { id: '1', email: 'test@test.com', nombre: 'Test', apellido: 'User', rol: 'PADRE' };
      service['perfilState'].set(mockResponse);

      let result: Perfil | undefined;
      service.asegurarPerfil().then(res => result = res);
      flushMicrotasks();

      expect(result).toEqual(mockResponse);
      httpMock.expectNone(`${environment.apiUrl}/usuarios/sync`);
    }));

    it('dado que no existe un perfil, deberia delegar a cargarPerfil', fakeAsync(() => {
      authSessionServiceSpy.obtenerAtributosUsuario.and.returnValue(Promise.resolve({ email: 'a@a.com', nombre: 'A', apellido: 'B' }));
      const mockResponse: Perfil = { id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'PADRE' };

      let result: Perfil | undefined;
      service.asegurarPerfil().then(res => result = res);
      flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/sync`);
      req.flush(mockResponse);
      flushMicrotasks();

      expect(result).toEqual(mockResponse);
    }));

    it('dado que existe un perfil pero su rol es PENDIENTE, deberia delegar a cargarPerfil', fakeAsync(() => {
      const pendingProfile: Perfil = { id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'PENDIENTE' as unknown as import('../models/perfil.model').RolUsuario } as unknown as Perfil;
      service['perfilState'].set(pendingProfile);

      authSessionServiceSpy.obtenerAtributosUsuario.and.returnValue(Promise.resolve({ email: 'a@a.com', nombre: 'A', apellido: 'B' }));
      const mockResponse: Perfil = { id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'PADRE' };

      let result: Perfil | undefined;
      service.asegurarPerfil().then(res => result = res);
      flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/sync`);
      req.flush(mockResponse);
      flushMicrotasks();

      expect(result).toEqual(mockResponse);
    }));
  });

  describe('actualizarDatosUsuario', () => {
    it('dado que no hay perfil cargado, deberia ignorar la actualizacion', () => {
      service.actualizarDatosUsuario({ email: 'nuevo@test.com' });
      expect(service.getPerfil()).toBeNull();
    });

    it('dado que hay un perfil cargado, deberia actualizar solo los datos pasados y persistir en storage', () => {
      const initialProfile: Perfil = { id: '1', email: 'viejo@test.com', nombre: 'Viejo', apellido: 'Ape', rol: 'PADRE' };
      service['perfilState'].set(initialProfile);

      service.actualizarDatosUsuario({ email: 'nuevo@test.com', firstName: 'Nuevo' });

      const updated = service.getPerfil();
      expect(updated?.email).toBe('nuevo@test.com');
      expect(updated?.nombre).toBe('Nuevo');
      expect(updated?.apellido).toBe('Ape');
      
      const stored = JSON.parse(localStorage.getItem('recred.perfil')!);
      expect(stored.email).toBe('nuevo@test.com');
    });
  });

  describe('obtenerBuffetId', () => {
    it('dado que no hay perfil, deberia retornar null', () => {
      expect(service.obtenerBuffetId()).toBeNull();
    });

    it('dado que el perfil tiene configurado buffetId directo, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'VENDEDOR', buffetId: 'b1' });
      expect(service.obtenerBuffetId()).toBe('b1');
    });

    it('dado que el perfil tiene configurado buffet en objeto, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'VENDEDOR', buffet: { id: 'b2' } });
      expect(service.obtenerBuffetId()).toBe('b2');
    });

    it('dado que el perfil tiene buffets array, deberia retornar el primero', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'VENDEDOR', buffets: [{ id: 'b3' }] });
      expect(service.obtenerBuffetId()).toBe('b3');
    });

    it('dado que el perfil tiene comercioId, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'VENDEDOR', comercioId: 'c1' });
      expect(service.obtenerBuffetId()).toBe('c1');
    });

    it('dado que el perfil tiene comercio en objeto, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'VENDEDOR', comercio: { id: 'c2' } });
      expect(service.obtenerBuffetId()).toBe('c2');
    });

    it('dado que el perfil tiene kioscoId, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'VENDEDOR', kioscoId: 'k1' });
      expect(service.obtenerBuffetId()).toBe('k1');
    });

    it('dado que el perfil tiene kiosco en objeto, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'VENDEDOR', kiosco: { id: 'k2' } });
      expect(service.obtenerBuffetId()).toBe('k2');
    });
  });

  describe('obtenerAlumnoId', () => {
    it('dado que no hay perfil, deberia retornar null', () => {
      expect(service.obtenerAlumnoId()).toBeNull();
    });

    it('dado que el perfil tiene alumnoId directo, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'ALUMNO', alumnoId: 'a1' });
      expect(service.obtenerAlumnoId()).toBe('a1');
    });

    it('dado que el perfil tiene alumno en objeto, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'ALUMNO', alumno: { id: 'a2' } });
      expect(service.obtenerAlumnoId()).toBe('a2');
    });

    it('dado que el perfil tiene alumnoEntity en objeto, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'ALUMNO', alumnoEntity: { id: 'a3' } });
      expect(service.obtenerAlumnoId()).toBe('a3');
    });

    it('dado que el perfil tiene studentId directo, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'ALUMNO', studentId: 's1' });
      expect(service.obtenerAlumnoId()).toBe('s1');
    });

    it('dado que el perfil tiene student en objeto, deberia retornarlo', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'ALUMNO', student: { id: 's2' } });
      expect(service.obtenerAlumnoId()).toBe('s2');
    });

    it('dado que el perfil no tiene ids especificos, deberia retornar su propio id', () => {
      service['perfilState'].set({ id: 'id-propio', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'ALUMNO' });
      expect(service.obtenerAlumnoId()).toBe('id-propio');
    });
  });

  describe('leerDeStorage', () => {
    it('dado que el storage contiene un json invalido, deberia limpiar el storage y retornar null', () => {
      localStorage.setItem('recred.perfil', '{ invalid_json }');
      const perfilStateValue = service['leerDeStorage']();
      expect(perfilStateValue).toBeNull();
      expect(localStorage.getItem('recred.perfil')).toBeNull();
    });
  });

  describe('rol signal', () => {
    it('dado que no hay perfil, el signal rol deberia emitir null', () => {
      expect(service.rol()).toBeNull();
    });

    it('dado que hay perfil, el signal rol deberia emitir el rol', () => {
      service['perfilState'].set({ id: '1', email: 'a@a.com', nombre: 'A', apellido: 'B', rol: 'VENDEDOR' });
      expect(service.rol()).toBe('VENDEDOR');
    });
  });
});
