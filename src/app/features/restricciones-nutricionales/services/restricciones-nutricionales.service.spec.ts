import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  ALUMNO_ID_TEST,
  ClasificacionSaludBackendMother,
} from '../restricciones-nutricionales.mother';
import { ClasificacionSaludBackend, RestriccionesNutricionalesService } from './restricciones-nutricionales.service';

describe('RestriccionesNutricionalesService', () => {
  const apiBase = environment.apiUrl;
  const URL_CATALOGO = `${apiBase}/clasificaciones-salud`;
  const URL_RESTRICCIONES_ALUMNO = (alumnoId: string): string =>
    `${apiBase}/control-parental/alumnos/${alumnoId}/obtener-restricciones-salud`;
  const URL_ACTUALIZAR = (alumnoId: string): string =>
    `${apiBase}/control-parental/alumnos/${alumnoId}/actualizar-restricciones-salud`;

  let service: RestriccionesNutricionalesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestriccionesNutricionalesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RestriccionesNutricionalesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getCatalogo', () => {
    it('cuando pido el catalogo, deberia hacer GET a /clasificaciones-salud', async () => {
      const catalogo = ClasificacionSaludBackendMother.crearCatalogoCompleto();

      const promesa = whenPidoElCatalogo();

      thenSeHizoGetCatalogo().flush(catalogo);

      expect(await promesa).toEqual(catalogo);
    });

    it('dado que el back devuelve error, cuando pido el catalogo, deberia rechazar la promesa', async () => {
      const promesa = whenPidoElCatalogo();

      thenSeHizoGetCatalogo().flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  describe('getRestriccionesAlumno', () => {
    it('dado un alumnoId, cuando pido las restricciones activas, deberia hacer GET al endpoint de control-parental', async () => {
      const activas = [ClasificacionSaludBackendMother.crear()];

      const promesa = whenPidoRestriccionesActivasDe(ALUMNO_ID_TEST);

      thenSeHizoGetRestriccionesActivasDe(ALUMNO_ID_TEST).flush(activas);

      expect(await promesa).toEqual(activas);
    });
  });

  describe('actualizarRestricciones', () => {
    it('dado un alumnoId y una lista de ids, cuando actualizo, deberia hacer PUT con clasificacionesIds en el body', async () => {
      const ids = ['uuid-tacc', 'uuid-sodio'];

      const promesa = whenActualizoRestriccionesDe(ALUMNO_ID_TEST, ids);

      thenSeHizoPutActualizarRestriccionesCon(ALUMNO_ID_TEST, ids).flush(null);

      await expectAsync(promesa).toBeResolved();
    });

    it('dado una lista vacia, cuando actualizo, deberia mandar el body con array vacio', async () => {
      const promesa = whenActualizoRestriccionesDe(ALUMNO_ID_TEST, []);

      thenSeHizoPutActualizarRestriccionesCon(ALUMNO_ID_TEST, []).flush(null);

      await expectAsync(promesa).toBeResolved();
    });
  });

  function whenPidoElCatalogo(): Promise<ClasificacionSaludBackend[]> {
    return service.getCatalogo();
  }

  function whenPidoRestriccionesActivasDe(alumnoId: string): Promise<ClasificacionSaludBackend[]> {
    return service.getRestriccionesAlumno(alumnoId);
  }

  function whenActualizoRestriccionesDe(alumnoId: string, ids: string[]): Promise<void> {
    return service.actualizarRestricciones(alumnoId, ids);
  }

  function thenSeHizoGetCatalogo(): TestRequest {
    const req = httpMock.expectOne(URL_CATALOGO);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoGetRestriccionesActivasDe(alumnoId: string): TestRequest {
    const req = httpMock.expectOne(URL_RESTRICCIONES_ALUMNO(alumnoId));
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoPutActualizarRestriccionesCon(alumnoId: string, clasificacionesIds: string[]): TestRequest {
    const req = httpMock.expectOne(URL_ACTUALIZAR(alumnoId));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ clasificacionesIds });
    return req;
  }
});
