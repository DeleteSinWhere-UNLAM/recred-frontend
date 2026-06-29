import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ResumenSemanalService } from './resumen-semanal.service';
import { environment } from '../../../../environments/environment';
import { ResumenSemanal } from '../models/resumen-semanal.model';

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
      
      const mockRespuesta: ResumenSemanal = {
        id: 'res-123',
        fechaDesde: '2023-01-01',
        fechaHasta: '2023-01-07',
        resumen: '{"hijos":{}}'
      };
      let respuestaObtenida: ResumenSemanal | undefined;

      service.getResumen().subscribe((data) => {
        respuestaObtenida = data;
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/resumen/me`);
      req.flush(mockRespuesta);

      expect(req.request.method).toBe('GET');
      expect(respuestaObtenida).toEqual(mockRespuesta);
    });
  });
});
