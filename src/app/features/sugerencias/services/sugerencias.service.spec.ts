import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SugerenciasService } from './sugerencias.service';
import { environment } from '../../../../environments/environment';
import { SugerenciaProducto, ComboSuggestion } from '../models/sugerencia-producto.model';
import { SugerenciasMother } from '../sugerencias.mother';

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
    it('debería hacer un GET a /kiosqueros/me/lista-sugerencia-cambio-producto', () => {
      const mockResponse: SugerenciaProducto[] = SugerenciasMother.crearSugerencias();
      let respuestaObtenida: SugerenciaProducto[] | undefined;

      whenPidoSugerencias(data => respuestaObtenida = data);
      thenSeHizoGetSugerenciasCorrectamente(mockResponse, () => respuestaObtenida);
    });

    it('debería manejar errores del servidor al obtener sugerencias', () => {
      let errorObtenido: any;

      whenPidoSugerenciasFalla(err => errorObtenido = err);
      thenSeRecibeErrorDeSugerencias(() => errorObtenido);
    });
  });

  describe('comprarSugerencia', () => {
    it('debería hacer un POST a /sugerencias-consumo/comprar', () => {
      const mockId = 'sug-123';
      let respuestaObtenida: any;

      whenComproSugerencia(mockId, data => respuestaObtenida = data);
      thenSeHizoPostCompraSugerenciaCorrectamente(mockId, () => respuestaObtenida);
    });

    it('debería manejar errores al comprar sugerencia', () => {
      const mockId = 'sug-123';
      let errorObtenido: any;

      whenComproSugerenciaFalla(mockId, err => errorObtenido = err);
      thenSeRecibeErrorAlComprar(() => errorObtenido);
    });
  });

  describe('getComboSuggestions', () => {
    it('debería hacer un GET a /combo-suggestions/:productId', () => {
      const productId = 'prod-123';
      const mockResponse: ComboSuggestion = SugerenciasMother.crearComboSuggestion();
      let respuestaObtenida: ComboSuggestion | undefined;

      whenPidoSugerenciaDeCombo(productId, data => respuestaObtenida = data);
      thenSeHizoGetComboSugerenciaCorrectamente(productId, mockResponse, () => respuestaObtenida);
    });

    it('debería manejar error al obtener sugerencias de combo', () => {
      const productId = 'prod-123';
      let errorObtenido: any;

      whenPidoSugerenciaDeComboFalla(productId, err => errorObtenido = err);
      thenSeRecibeErrorDeCombo(() => errorObtenido);
    });
  });

  function whenPidoSugerencias(callback: (data: any) => void): void {
    service.getSugerencias().subscribe(response => callback(response));
  }

  function whenPidoSugerenciasFalla(callback: (err: any) => void): void {
    service.getSugerencias().subscribe({
      next: () => fail('debería haber fallado con un error 500'),
      error: (error) => callback(error)
    });
  }

  function whenComproSugerencia(id: string, callback: (data: any) => void): void {
    service.comprarSugerencia(id).subscribe(response => callback(response));
  }

  function whenComproSugerenciaFalla(id: string, callback: (err: any) => void): void {
    service.comprarSugerencia(id).subscribe({
      next: () => fail('debería haber fallado con un error 400'),
      error: (error) => callback(error)
    });
  }

  function whenPidoSugerenciaDeCombo(id: string, callback: (data: any) => void): void {
    service.getComboSuggestions(id).subscribe(response => callback(response));
  }

  function whenPidoSugerenciaDeComboFalla(id: string, callback: (err: any) => void): void {
    service.getComboSuggestions(id).subscribe({
      next: () => fail('debería fallar con error 404'),
      error: (error) => callback(error)
    });
  }

  function thenSeHizoGetSugerenciasCorrectamente(mockResponse: any, recibida: () => any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/me/lista-sugerencia-cambio-producto`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
    expect(recibida()).toEqual(mockResponse);
  }

  function thenSeRecibeErrorDeSugerencias(error: () => any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/me/lista-sugerencia-cambio-producto`);
    req.flush('Error del servidor', { status: 500, statusText: 'Internal Server Error' });
    expect(error().status).toBe(500);
  }

  function thenSeHizoPostCompraSugerenciaCorrectamente(id: string, recibida: () => any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/sugerencias-consumo/comprar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sugerenciaId: id });
    req.flush(null);
    expect(recibida()).toBeNull();
  }

  function thenSeRecibeErrorAlComprar(error: () => any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/sugerencias-consumo/comprar`);
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    expect(error().status).toBe(400);
  }

  function thenSeHizoGetComboSugerenciaCorrectamente(id: string, mockResponse: any, recibida: () => any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/combo-suggestions/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
    expect(recibida()).toEqual(mockResponse);
  }

  function thenSeRecibeErrorDeCombo(error: () => any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/combo-suggestions/prod-123`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(error().status).toBe(404);
  }
});
