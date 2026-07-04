import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { RolUsuario } from '../../../data-access/models/perfil.model';
import { AsistenteVirtualService, ContextoAsistente } from './asistente-virtual.service';
import {
  MensajeAsistenteResponseMother,
  RespuestaAsistenteMother,
  SesionAsistenteResponseMother,
} from '../asistente-virtual.mother';

describe('AsistenteVirtualService', () => {
  let service: AsistenteVirtualService;
  let httpMock: HttpTestingController;

  const IA_BASE = `${environment.apiUrl.replace(/\/$/, '')}/ia`;
  const SESION_ID = 'sesion-1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AsistenteVirtualService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AsistenteVirtualService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('dado que se inyecta el servicio, deberia crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('enviarMensaje', () => {
    it('dado un rol ALUMNO con sesion, cuando envio un mensaje, deberia hacer POST con sesionId y mensaje', async () => {
      const respuesta = RespuestaAsistenteMother.crear();

      const promesa = whenEnvioMensaje('ALUMNO', 'hola', SESION_ID);
      const req = thenSeHizoPostAMensajes('ALUMNO');
      req.flush(respuesta);
      const resultado = await promesa;

      expect(req.request.body).toEqual({ sesionId: SESION_ID, mensaje: 'hola' });
      expect(resultado).toEqual(respuesta);
    });

    it('dado un rol PADRE sin sesion, cuando envio un mensaje, deberia omitir sesionId del body', async () => {
      const respuesta = RespuestaAsistenteMother.crear();

      const promesa = whenEnvioMensaje('PADRE', 'hola', null);
      const req = thenSeHizoPostAMensajes('PADRE');
      req.flush(respuesta);
      await promesa;

      expect(req.request.body).toEqual({ mensaje: 'hola' });
    });

    it('dado un rol VENDEDOR, cuando envio un mensaje, deberia usar el path de kiosqueros', async () => {
      const respuesta = RespuestaAsistenteMother.crear();

      const promesa = whenEnvioMensaje('VENDEDOR', 'stock', null);
      const req = thenSeHizoPostAMensajes('VENDEDOR');
      req.flush(respuesta);
      await promesa;

      expect(req.request.method).toBe('POST');
    });
  });

  describe('listarSesiones', () => {
    it('dado un rol ALUMNO, cuando listo sesiones, deberia hacer GET a /sesiones y devolver el arreglo', async () => {
      const sesiones = [SesionAsistenteResponseMother.crear()];

      const promesa = whenListoSesiones('ALUMNO');
      const req = thenSeHizoGetASesiones('ALUMNO');
      req.flush(sesiones);
      const resultado = await promesa;

      expect(resultado).toEqual(sesiones);
    });
  });

  describe('obtenerMensajes', () => {
    it('dado un sesionId con espacios, cuando obtengo mensajes, deberia hacer GET con el id codificado', async () => {
      const sesionId = 'sesion con espacios';
      const mensajes = [
        MensajeAsistenteResponseMother.crearUsuario(),
        MensajeAsistenteResponseMother.crearAsistente(),
      ];

      const promesa = whenObtengoMensajes('ALUMNO', sesionId);
      const req = thenSeHizoGetAMensajesDeSesion('ALUMNO', sesionId);
      req.flush(mensajes);
      const resultado = await promesa;

      expect(resultado).toEqual(mensajes);
    });
  });

  describe('cerrarSesion', () => {
    it('dado un sesionId, cuando cierro la sesion, deberia hacer PATCH a /sesiones/{id}/cerrar con body vacio', async () => {
      const promesa = whenCierroSesion('ALUMNO', SESION_ID);
      const req = thenSeHizoPatchACerrarSesion('ALUMNO', SESION_ID);
      req.flush(null);
      await promesa;

      expect(req.request.body).toEqual({});
    });
  });

  describe('eliminarSesion', () => {
    it('dado un sesionId, cuando elimino la sesion, deberia hacer DELETE a /sesiones/{id}', async () => {
      const promesa = whenEliminoSesion('ALUMNO', SESION_ID);
      const req = thenSeHizoDeleteASesion('ALUMNO', SESION_ID);
      req.flush(null);
      await promesa;

      expect(req.request.method).toBe('DELETE');
    });
  });

  function contextoPara(rol: RolUsuario): ContextoAsistente {
    return { rol };
  }

  function basePathPorRol(rol: RolUsuario): string {
    switch (rol) {
      case 'PADRE':
        return `${IA_BASE}/tutores/me/asistente`;
      case 'VENDEDOR':
        return `${IA_BASE}/kiosqueros/me/asistente`;
      case 'ALUMNO':
        return `${IA_BASE}/alumnos/me/asistente`;
      case 'ADMIN':
        return `${IA_BASE}/admin/asistente`;
    }
  }

  function whenEnvioMensaje(rol: RolUsuario, mensaje: string, sesionId: string | null) {
    return service.enviarMensaje(contextoPara(rol), mensaje, sesionId);
  }

  function whenListoSesiones(rol: RolUsuario) {
    return service.listarSesiones(contextoPara(rol));
  }

  function whenObtengoMensajes(rol: RolUsuario, sesionId: string) {
    return service.obtenerMensajes(contextoPara(rol), sesionId);
  }

  function whenCierroSesion(rol: RolUsuario, sesionId: string) {
    return service.cerrarSesion(contextoPara(rol), sesionId);
  }

  function whenEliminoSesion(rol: RolUsuario, sesionId: string) {
    return service.eliminarSesion(contextoPara(rol), sesionId);
  }

  function thenSeHizoPostAMensajes(rol: RolUsuario): TestRequest {
    const req = httpMock.expectOne(`${basePathPorRol(rol)}/mensajes`);
    expect(req.request.method).toBe('POST');
    return req;
  }

  function thenSeHizoGetASesiones(rol: RolUsuario): TestRequest {
    const req = httpMock.expectOne(`${basePathPorRol(rol)}/sesiones`);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoGetAMensajesDeSesion(rol: RolUsuario, sesionId: string): TestRequest {
    const req = httpMock.expectOne(
      `${basePathPorRol(rol)}/sesiones/${encodeURIComponent(sesionId)}/mensajes`,
    );
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoPatchACerrarSesion(rol: RolUsuario, sesionId: string): TestRequest {
    const req = httpMock.expectOne(`${basePathPorRol(rol)}/sesiones/${sesionId}/cerrar`);
    expect(req.request.method).toBe('PATCH');
    return req;
  }

  function thenSeHizoDeleteASesion(rol: RolUsuario, sesionId: string): TestRequest {
    const req = httpMock.expectOne(`${basePathPorRol(rol)}/sesiones/${sesionId}`);
    expect(req.request.method).toBe('DELETE');
    return req;
  }
});
