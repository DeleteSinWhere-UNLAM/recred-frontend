import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SugerenciasCarritoService } from './sugerencias-carrito.service';
import { environment } from '../../../../environments/environment';
import { SugerenciaCarrito, SugerenciaCarritoRequest } from '../models/sugerencia-carrito.model';

describe('SugerenciasCarritoService', () => {
  let service: SugerenciasCarritoService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SugerenciasCarritoService]
    });
    service = TestBed.inject(SugerenciasCarritoService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('obtenerSugerencias', () => {
    it('dado que se requieren sugerencias, debe llamar a POST', () => {
      const mockRequest: SugerenciaCarritoRequest = { presupuesto: 100 } as any;
      const mockResponse: SugerenciaCarrito[] = [];

      service.obtenerSugerencias(mockRequest).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/cart-suggestions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });
});
