import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  ALUMNO_ID_TEST,
  RestriccionHorariaMother,
  TimeRestrictionCommandMother,
} from '../restricciones-horarias.mother';
import { RestriccionesHorariasService } from './restricciones-horarias.service';

describe('RestriccionesHorariasService', () => {
  const BASE = `${environment.apiUrl}/time-restrictions`;

  let service: RestriccionesHorariasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestriccionesHorariasService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RestriccionesHorariasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getRestriccionesPorAlumno', () => {
    it('dado un alumnoId, cuando pido las restricciones, deberia hacer GET a /time-restrictions/student/{id}', async () => {
      const restricciones = [RestriccionHorariaMother.crearPorCategoria()];

      const promesa = service.getRestriccionesPorAlumno(ALUMNO_ID_TEST);
      const req = httpMock.expectOne(`${BASE}/student/${ALUMNO_ID_TEST}`);
      expect(req.request.method).toBe('GET');
      req.flush(restricciones);

      expect(await promesa).toEqual(restricciones);
    });

    it('dado que el back devuelve error, cuando pido las restricciones, deberia rechazar la promesa', async () => {
      spyOn(console, 'error');

      const promesa = service.getRestriccionesPorAlumno(ALUMNO_ID_TEST);
      httpMock
        .expectOne(`${BASE}/student/${ALUMNO_ID_TEST}`)
        .flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  describe('crearRestriccion', () => {
    it('dado un command, cuando creo una restriccion, deberia hacer POST a /time-restrictions con el body', async () => {
      const command = TimeRestrictionCommandMother.crear({ categoryId: 'cat-bebidas' });
      const respuesta = RestriccionHorariaMother.crearPorCategoria();

      const promesa = service.crearRestriccion(command);
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(command);
      req.flush(respuesta);

      expect(await promesa).toEqual(respuesta);
    });
  });

  describe('actualizarRestriccion', () => {
    it('dado un id y un command, cuando actualizo, deberia hacer PUT a /time-restrictions/{id}', async () => {
      const command = TimeRestrictionCommandMother.crear();
      const respuesta = RestriccionHorariaMother.crear();

      const promesa = service.actualizarRestriccion('restriccion-1', command);
      const req = httpMock.expectOne(`${BASE}/restriccion-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(command);
      req.flush(respuesta);

      expect(await promesa).toEqual(respuesta);
    });
  });

  describe('deshabilitarRestriccion', () => {
    it('dado un id, cuando deshabilito, deberia hacer PATCH a /time-restrictions/{id}/disable con body vacio', async () => {
      const promesa = service.deshabilitarRestriccion('restriccion-1');
      const req = httpMock.expectOne(`${BASE}/restriccion-1/disable`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush(null);

      await expectAsync(promesa).toBeResolved();
    });
  });
});
