import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ALUMNO_ID_TEST, PrediccionGastoMother } from '../prediccion-gasto.mother';
import { PrediccionGastoService } from './prediccion-gasto.service';

describe('PrediccionGastoService', () => {
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

      const promesa = firstValueFrom(service.getPrediction(ALUMNO_ID_TEST));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/ia/alumnos/${ALUMNO_ID_TEST}/prediccion-gasto`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(prediccion);

      expect(await promesa).toEqual(prediccion);
    });

    it('dado un alumnoId vacio, cuando pido la prediccion, deberia tirar el error de "No se encontro"', () => {
      expect(() => service.getPrediction('')).toThrowError(
        /No se encontró el ID del alumno/,
      );
    });
  });
});
