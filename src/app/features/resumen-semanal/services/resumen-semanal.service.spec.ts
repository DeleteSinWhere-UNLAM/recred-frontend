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
    // Verificamos que no haya peticiones http pendientes después de cada test
    httpMock.verify();
  });

  it('debería ser creado', () => {
    expect(service).toBeTruthy();
  });

  it('debería hacer una petición GET a la API al endpoint /resumen/me', () => {
    const mockRespuesta: ResumenSemanal = {
      id: 'res-123',
      fechaDesde: '2023-01-01',
      fechaHasta: '2023-01-07',
      resumen: '{"hijos":{}}'
    };

    // Llamamos al método
    service.getResumen().subscribe((data) => {
      expect(data).toEqual(mockRespuesta);
    });

    // Esperamos que se haga una petición HTTP a la URL construida
    const req = httpMock.expectOne(`${environment.apiUrl}/resumen/me`);
    
    // Verificamos que sea de tipo GET
    expect(req.request.method).toBe('GET');

    // Respondemos a la petición con nuestros datos de prueba
    req.flush(mockRespuesta);
  });
});
