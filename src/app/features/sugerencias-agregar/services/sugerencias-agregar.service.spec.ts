import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SugerenciasAgregarService } from './sugerencias-agregar.service';
import { environment } from '../../../../environments/environment';
import { SugerenciaAgregarProducto } from '../models/sugerencia-agregar.model';
import { SugerenciasAgregarMother } from '../sugerencias-agregar.mother';

describe('SugerenciasAgregarService', () => {
  let service: SugerenciasAgregarService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl;

  const mockResponse: SugerenciaAgregarProducto[] = SugerenciasAgregarMother.crearListaSugerencias();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SugerenciasAgregarService
      ]
    });
    service = TestBed.inject(SugerenciasAgregarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería ser creado', () => {
    expect(service).toBeTruthy();
  });

  it('getSugerenciasAgregarProducto debería hacer un GET al endpoint correcto', () => {
    service.getSugerenciasAgregarProducto().subscribe((data) => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/sugerencias/agregar-producto`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
