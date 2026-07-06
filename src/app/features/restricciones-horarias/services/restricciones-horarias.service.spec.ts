import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { RestriccionHoraria, TimeRestrictionCommand } from '../models/restriccion-horaria.model';
import {
  ALUMNO_ID_TEST,
  RestriccionHorariaMother,
  TimeRestrictionCommandMother,
} from '../restricciones-horarias.mother';
import { RestriccionesHorariasService } from './restricciones-horarias.service';

describe('RestriccionesHorariasService', () => {
  const BASE = `${environment.apiUrl}/time-restrictions`;
  const URL_STUDENT = (alumnoId: string): string => `${BASE}/student/${alumnoId}`;
  const URL_BY_ID = (id: string): string => `${BASE}/${id}`;

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

      const promesa = whenPidoRestriccionesDe(ALUMNO_ID_TEST);

      thenSeHizoGetRestriccionesDe(ALUMNO_ID_TEST).flush(restricciones);

      expect(await promesa).toEqual(restricciones);
    });

    it('dado que el back devuelve error, cuando pido las restricciones, deberia rechazar la promesa', async () => {
      spyOn(console, 'error');

      const promesa = whenPidoRestriccionesDe(ALUMNO_ID_TEST);

      thenSeHizoGetRestriccionesDe(ALUMNO_ID_TEST).flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  describe('crearRestriccion', () => {
    it('dado un command, cuando creo una restriccion, deberia hacer POST a /time-restrictions con el body', async () => {
      const command = TimeRestrictionCommandMother.crear({ categoryId: 'cat-bebidas' });
      const respuesta = RestriccionHorariaMother.crearPorCategoria();

      const promesa = whenCreoRestriccionCon(command);

      thenSeHizoPostRestriccionCon(command).flush(respuesta);

      expect(await promesa).toEqual(respuesta);
    });
  });

  describe('actualizarRestriccion', () => {
    it('dado un id y un command, cuando actualizo, deberia hacer PUT a /time-restrictions/{id}', async () => {
      const command = TimeRestrictionCommandMother.crear();
      const respuesta = RestriccionHorariaMother.crear();

      const promesa = whenActualizoRestriccion('restriccion-1', command);

      thenSeHizoPutRestriccion('restriccion-1', command).flush(respuesta);

      expect(await promesa).toEqual(respuesta);
    });
  });

  describe('deshabilitarRestriccion', () => {
    it('dado un id, cuando deshabilito, deberia hacer PATCH a /time-restrictions/{id}/disable con body vacio', async () => {
      const promesa = whenDeshabilitoRestriccion('restriccion-1');

      thenSeHizoPatchDisableDe('restriccion-1').flush(null);

      await expectAsync(promesa).toBeResolved();
    });
  });

  function whenPidoRestriccionesDe(alumnoId: string): Promise<RestriccionHoraria[]> {
    return service.getRestriccionesPorAlumno(alumnoId);
  }

  function whenCreoRestriccionCon(command: TimeRestrictionCommand): Promise<RestriccionHoraria> {
    return service.crearRestriccion(command);
  }

  function whenActualizoRestriccion(id: string, command: TimeRestrictionCommand): Promise<RestriccionHoraria> {
    return service.actualizarRestriccion(id, command);
  }

  function whenDeshabilitoRestriccion(id: string): Promise<void> {
    return service.deshabilitarRestriccion(id);
  }

  function thenSeHizoGetRestriccionesDe(alumnoId: string): TestRequest {
    const req = httpMock.expectOne(URL_STUDENT(alumnoId));
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoPostRestriccionCon(command: TimeRestrictionCommand): TestRequest {
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(command);
    return req;
  }

  function thenSeHizoPutRestriccion(id: string, command: TimeRestrictionCommand): TestRequest {
    const req = httpMock.expectOne(URL_BY_ID(id));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(command);
    return req;
  }

  function thenSeHizoPatchDisableDe(id: string): TestRequest {
    const req = httpMock.expectOne(`${BASE}/${id}/disable`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    return req;
  }
});
