import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SugerenciasAgregarService } from './sugerencias-agregar.service';
import { environment } from '../../../../environments/environment';
import { SugerenciaAgregarProducto } from '../models/sugerencia-agregar.model';

describe('SugerenciasAgregarService', () => {
  let service: SugerenciasAgregarService;
  let httpMock: HttpTestingController;

  const mockUserId = 'user-123';
  const baseUrl = environment.apiUrl;

  const mockResponse: SugerenciaAgregarProducto[] = [
    {
      id: '1',
      alumnoId: null,
      buffetId: 'buffet-1',
      productoId: 'prod-1',
      titulo: 'Sugerencia 1',
      mensaje: 'Mensaje 1',
      metadata: {
        totalSales: 10,
        productName: 'Producto 1',
        productPrice: 100,
        totalRevenue: 1000,
        totalCustomers: 5
      }
    }
  ];

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
    service.getSugerenciasAgregarProducto(mockUserId).subscribe((data) => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/sugerencias/agregar-producto/${mockUserId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
