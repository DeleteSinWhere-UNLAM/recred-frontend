import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SugerenciasService } from './sugerencias.service';
import { environment } from '../../../../environments/environment';
import { SugerenciaProducto } from '../models/sugerencia-producto.model';
import { Product } from '../../updated-inventory/models/product.interface';

describe('SugerenciasService', () => {
  let service: SugerenciasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SugerenciasService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(SugerenciasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getSugerencias', () => {
    it('debería hacer un GET a /kiosqueros/:id/lista-sugerencia-cambio-producto', () => {
      const mockId = 'user-123';
      const mockResponse: SugerenciaProducto[] = [];

      service.getSugerencias(mockId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/${mockId}/lista-sugerencia-cambio-producto`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('comprarSugerencia', () => {
    it('debería hacer un POST a /sugerencias-consumo/comprar', () => {
      const mockId = 'sug-123';

      service.comprarSugerencia(mockId).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sugerencias-consumo/comprar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ sugerenciaId: mockId });
      req.flush(null);
    });
  });

  describe('getComboSuggestions', () => {
    it('debería hacer un GET a /combo-suggestions/:productId/:userId', () => {
      const productId = 'prod-123';
      const userId = 'user-123';
      const mockResponse: Product[] = [];

      service.getComboSuggestions(productId, userId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/combo-suggestions/${productId}/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
