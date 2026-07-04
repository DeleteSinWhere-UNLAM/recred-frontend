import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  ALUMNO_ID_TEST,
  ClasificacionSaludBackendMother,
} from '../restricciones-nutricionales.mother';
import { RestriccionesNutricionalesService } from './restricciones-nutricionales.service';

describe('RestriccionesNutricionalesService', () => {
  const apiBase = environment.apiUrl;
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

      const promesa = service.getCatalogo();
      const req = httpMock.expectOne(`${apiBase}/clasificaciones-salud`);
      expect(req.request.method).toBe('GET');
      req.flush(catalogo);

      expect(await promesa).toEqual(catalogo);
    });

    it('dado que el back devuelve error, cuando pido el catalogo, deberia rechazar la promesa', async () => {
      const promesa = service.getCatalogo();
      httpMock
        .expectOne(`${apiBase}/clasificaciones-salud`)
        .flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  describe('getRestriccionesAlumno', () => {
    it('dado un alumnoId, cuando pido las restricciones activas, deberia hacer GET al endpoint de control-parental', async () => {
      const activas = [ClasificacionSaludBackendMother.crear()];

      const promesa = service.getRestriccionesAlumno(ALUMNO_ID_TEST);
      const req = httpMock.expectOne(
        `${apiBase}/control-parental/alumnos/${ALUMNO_ID_TEST}/obtener-restricciones-salud`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(activas);

      expect(await promesa).toEqual(activas);
    });
  });

  describe('actualizarRestricciones', () => {
    it('dado un alumnoId y una lista de ids, cuando actualizo, deberia hacer PUT con clasificacionesIds en el body', async () => {
      const ids = ['uuid-tacc', 'uuid-sodio'];

      const promesa = service.actualizarRestricciones(ALUMNO_ID_TEST, ids);
      const req = httpMock.expectOne(
        `${apiBase}/control-parental/alumnos/${ALUMNO_ID_TEST}/actualizar-restricciones-salud`,
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ clasificacionesIds: ids });
      req.flush(null);

      await expectAsync(promesa).toBeResolved();
    });

    it('dada una lista vacia, cuando actualizo, deberia mandar el body con array vacio', async () => {
      const promesa = service.actualizarRestricciones(ALUMNO_ID_TEST, []);
      const req = httpMock.expectOne(
        `${apiBase}/control-parental/alumnos/${ALUMNO_ID_TEST}/actualizar-restricciones-salud`,
      );
      expect(req.request.body).toEqual({ clasificacionesIds: [] });
      req.flush(null);

      await expectAsync(promesa).toBeResolved();
    });
  });
});
