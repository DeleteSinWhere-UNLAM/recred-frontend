import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AiVisionService } from './ai-vision-service';
import { environment } from '../../../../../environments/environment';

describe('AiVisionService', () => {
  let service: AiVisionService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiVisionService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AiVisionService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('debería ser creado', () => {
    expect(service).toBeTruthy();
  });

  it('analyzeImage debería hacer un POST con FormData', () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    const mockResponse = { is_valid: true, nombre: 'Producto AI' };

    service.analyzeImage(mockFile).subscribe((res) => {
      expect(res).toEqual(mockResponse as any);
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/load-stock/upload-image`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('image')).toBe(mockFile);
    req.flush(mockResponse);
  });

  it('saveProduct debería hacer un POST', () => {
    const mockRequest = { 
      nombre: 'Test', precio: 100, descripcion: '', peso: 0, 
      stockActual: 10, categoriaId: '1', requierePreparacion: false, buffetId: '1',
      nuevaCategoriaNombre: '', clasificacionesSaludIds: [], tiposIds: []
    };

    service.saveProduct(mockRequest).subscribe((res) => {
      expect(res).toBeTruthy();
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/load-stock/save-product`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush({ success: true });
  });
});
