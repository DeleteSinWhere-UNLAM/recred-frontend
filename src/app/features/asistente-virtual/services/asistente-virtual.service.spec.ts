import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AsistenteVirtualService, ContextoAsistente } from './asistente-virtual.service';
import { environment } from '../../../../environments/environment';
import { RespuestaAsistente } from '../models/respuesta-asistente.model';
import { SesionAsistenteResponse, MensajeAsistenteResponse } from '../models/sesion-asistente.model';

describe('AsistenteVirtualService', () => {
  let service: AsistenteVirtualService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AsistenteVirtualService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AsistenteVirtualService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getBasePath', () => {
    it('dado que el rol es PADRE, deberia devolver la ruta de tutores', () => {
      const contexto: ContextoAsistente = { rol: 'PADRE' };
      expect(service['getBasePath'](contexto)).toContain('/tutores/me/asistente');
    });

    it('dado que el rol es VENDEDOR, deberia devolver la ruta de kiosqueros', () => {
      const contexto: ContextoAsistente = { rol: 'VENDEDOR' };
      expect(service['getBasePath'](contexto)).toContain('/kiosqueros/me/asistente');
    });

    it('dado que el rol es ALUMNO y tiene id, deberia devolver la ruta con id del alumno', () => {
      const contexto: ContextoAsistente = { rol: 'ALUMNO', alumnoId: '123' };
      expect(service['getBasePath'](contexto)).toContain('/alumnos/123/asistente');
    });

    it('dado que el rol es ALUMNO pero no tiene id, deberia lanzar un error', () => {
      const contexto: ContextoAsistente = { rol: 'ALUMNO', alumnoId: '' };
      expect(() => service['getBasePath'](contexto)).toThrowError('No se pudo resolver el alumno para usar el asistente.');
    });
  });

  describe('endpoints', () => {
    const contexto: ContextoAsistente = { rol: 'PADRE' };
    const basePath = `${environment.apiUrl.replace(/\/$/, '')}/ia/tutores/me/asistente`;

    it('dado que se envia un mensaje con sesionId, deberia enviarlo en el body', async () => {
      const mockRespuesta: RespuestaAsistente = { respuesta: 'hola', sesionId: 's1', generadoPorIa: true };
      
      const p = service.enviarMensaje(contexto, 'test', 's1');
      
      const req = httpMock.expectOne(`${basePath}/mensajes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ sesionId: 's1', mensaje: 'test' });
      req.flush(mockRespuesta);

      expect(await p).toEqual(mockRespuesta);
    });

    it('dado que se envia un mensaje sin sesionId, deberia enviarlo sin sesionId en el body', async () => {
      const mockRespuesta: RespuestaAsistente = { respuesta: 'hola', sesionId: 's2', generadoPorIa: true };
      
      const p = service.enviarMensaje(contexto, 'test2', null);
      
      const req = httpMock.expectOne(`${basePath}/mensajes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ mensaje: 'test2' });
      req.flush(mockRespuesta);

      expect(await p).toEqual(mockRespuesta);
    });

    it('dado que se solicita listar sesiones, deberia hacer la peticion get', async () => {
      const mockSesiones: SesionAsistenteResponse[] = [];
      const p = service.listarSesiones(contexto);

      const req = httpMock.expectOne(`${basePath}/sesiones`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSesiones);

      expect(await p).toEqual(mockSesiones);
    });

    it('dado que se solicitan los mensajes de una sesion, deberia hacer peticion get a mensajes', async () => {
      const mockMensajes: MensajeAsistenteResponse[] = [];
      const p = service.obtenerMensajes(contexto, 'sesion-test');

      const req = httpMock.expectOne(`${basePath}/sesiones/sesion-test/mensajes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMensajes);

      expect(await p).toEqual(mockMensajes);
    });

    it('dado que se pide cerrar sesion, deberia enviar peticion patch', async () => {
      const p = service.cerrarSesion(contexto, 'sesion-test');

      const req = httpMock.expectOne(`${basePath}/sesiones/sesion-test/cerrar`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);

      await expectAsync(p).toBeResolved();
    });

    it('dado que se pide eliminar sesion, deberia enviar peticion delete', async () => {
      const p = service.eliminarSesion(contexto, 'sesion-test');

      const req = httpMock.expectOne(`${basePath}/sesiones/sesion-test`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await expectAsync(p).toBeResolved();
    });
  });
});
