import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SugerenciasService } from './sugerencias.service';
import { environment } from '../../../../environments/environment';
import { SugerenciaProducto, ComboSuggestion } from '../models/sugerencia-producto.model';

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

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
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

    it('debería manejar errores del servidor al obtener sugerencias', () => {
      const mockId = 'user-123';

      service.getSugerencias(mockId).subscribe({
        next: () => fail('debería haber fallado con un error 500'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/${mockId}/lista-sugerencia-cambio-producto`);
      req.flush('Error del servidor', { status: 500, statusText: 'Internal Server Error' });
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

    it('debería manejar errores al comprar sugerencia', () => {
      const mockId = 'sug-123';

      service.comprarSugerencia(mockId).subscribe({
        next: () => fail('debería haber fallado con un error 400'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sugerencias-consumo/comprar`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getComboSuggestions', () => {
    it('debería hacer un GET a /combo-suggestions/:productId/:userId', () => {
      const productId = 'prod-123';
      const userId = 'user-123';
      const mockResponse: ComboSuggestion = {
        idProduct: 'prod-123',
        productName: 'Test Producto',
        suggestedProducts: []
      };

      service.getComboSuggestions(productId, userId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/combo-suggestions/${productId}/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería manejar error al obtener sugerencias de combo', () => {
      const productId = 'prod-123';
      const userId = 'user-123';

      service.getComboSuggestions(productId, userId).subscribe({
        next: () => fail('debería fallar con error 404'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/combo-suggestions/${productId}/${userId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
