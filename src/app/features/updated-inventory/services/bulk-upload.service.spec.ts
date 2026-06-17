import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BulkUploadService, BulkUploadResponse } from './bulk-upload.service';
import { environment } from '../../../../environments/environment';

describe('BulkUploadService', () => {
  let service: BulkUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BulkUploadService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(BulkUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que subo un archivo, deberia hacer un POST con formData al endpoint correcto', () => {
    const mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const mockResponse: BulkUploadResponse = {
      products: [
        {
          nombre: 'Agua Mineral',
          descripcion: 'Botella individual',
          precio: 600.0,
          peso: 500.0,
          requierePreparacion: false,
          categoriaId: null,
          nuevaCategoriaNombre: 'Bebidas',
          stockActual: 50,
          saludEtiquetasIds: [],
          tipoEtiquetasIds: [],
        }
      ]
    };

    service.uploadFile(mockFile).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/products/bulk-upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).has('file')).toBeTrue();
    req.flush(mockResponse);
  });
});
