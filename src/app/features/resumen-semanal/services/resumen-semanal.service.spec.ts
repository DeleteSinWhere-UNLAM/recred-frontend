import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ResumenSemanalService } from './resumen-semanal.service';
import { environment } from '../../../../environments/environment';
import { ResumenSemanal } from '../models/resumen-semanal.model';
import { ResumenSemanalMother } from '../resumen-semanal.mother';

describe('ResumenSemanalService', () => {
  let service: ResumenSemanalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ResumenSemanalService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ResumenSemanalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Obtención de datos', () => {
    it('debería solicitar el resumen semanal realizando un GET al endpoint correspondiente', () => {
      const mockRespuesta: ResumenSemanal = ResumenSemanalMother.crearResumen();
      let respuestaObtenida: ResumenSemanal | undefined;

      givenEstadoDeRedLimpio();
      whenSolicitoResumen();
      thenElServicioHaceUnGetCorrectoYDevuelveLaRespuesta();

      function givenEstadoDeRedLimpio() {
        // Estado limpio inicializado en variables locales
      }

      function whenSolicitoResumen() {
        service.getResumen().subscribe((data) => {
          respuestaObtenida = data;
        });
      }

      function thenElServicioHaceUnGetCorrectoYDevuelveLaRespuesta() {
        const req = httpMock.expectOne(`${environment.apiUrl}/resumen/me`);
        expect(req.request.method).toBe('GET');
        req.flush(mockRespuesta);
        expect(respuestaObtenida).toEqual(mockRespuesta);
      }
    });
  });
});
