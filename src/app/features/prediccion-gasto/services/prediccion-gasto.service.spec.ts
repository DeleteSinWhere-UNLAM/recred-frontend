import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PrediccionGasto } from '../models/prediccion-gasto.interface';
import { ALUMNO_ID_TEST, PrediccionGastoMother } from '../prediccion-gasto.mother';
import { PrediccionGastoService } from './prediccion-gasto.service';

describe('PrediccionGastoService', () => {
  const URL_PREDICCION = (alumnoId: string): string =>
    `${environment.apiUrl}/ia/alumnos/${alumnoId}/prediccion-gasto`;

  let service: PrediccionGastoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PrediccionGastoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PrediccionGastoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getPrediction', () => {
    it('dado un alumnoId valido, cuando pido la prediccion, deberia hacer GET al endpoint de IA', async () => {
      const prediccion = PrediccionGastoMother.crear();

      const promesa = whenPidoPrediccionDe(ALUMNO_ID_TEST);

      thenSeHizoGetPrediccionDe(ALUMNO_ID_TEST).flush(prediccion);

      expect(await promesa).toEqual(prediccion);
    });

    it('dado un alumnoId vacio, cuando pido la prediccion, deberia tirar el error de "No se encontro"', () => {
      expect(() => service.getPrediction('')).toThrowError(/No se encontró el ID del alumno/);
    });
  });

  function whenPidoPrediccionDe(alumnoId: string): Promise<PrediccionGasto> {
    return firstValueFrom(service.getPrediction(alumnoId));
  }

  function thenSeHizoGetPrediccionDe(alumnoId: string): TestRequest {
    const req = httpMock.expectOne(URL_PREDICCION(alumnoId));
    expect(req.request.method).toBe('GET');
    return req;
  }
});
