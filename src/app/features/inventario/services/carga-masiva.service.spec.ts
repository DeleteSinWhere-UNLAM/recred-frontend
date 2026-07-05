import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RespuestaCargaMasivaMother, RespuestaProductoMasivoMother } from '../inventario.mother';
import { CargaMasivaService, RespuestaCargaMasiva } from './carga-masiva.service';

describe('CargaMasivaService', () => {
  const URL_BULK = `${environment.apiUrl}/products/bulk-upload`;

  let service: CargaMasivaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CargaMasivaService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CargaMasivaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('uploadFile', () => {
    it('dado un archivo, cuando lo subo, deberia hacer POST al endpoint con FormData que contiene el archivo', async () => {
      const archivo = new File(['dummy'], 'productos.pdf', { type: 'application/pdf' });

      const promesa = whenSuboElArchivo(archivo);

      const req = httpMock.expectOne(URL_BULK);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).get('file')).toBe(archivo);

      req.flush(RespuestaCargaMasivaMother.crear());
      await promesa;
    });

    it('dado que el back devuelve productos, cuando subo, deberia resolver con la respuesta parseada', async () => {
      const respuesta = RespuestaCargaMasivaMother.crear({
        products: [
          RespuestaProductoMasivoMother.crear({ nombre: 'Agua' }),
          RespuestaProductoMasivoMother.crear({ nombre: 'Alfajor', precio: 500 }),
        ],
      });

      const promesa = whenSuboElArchivo(new File(['x'], 'x.pdf', { type: 'application/pdf' }));
      httpMock.expectOne(URL_BULK).flush(respuesta);

      const resultado = await promesa;
      expect(resultado.products.length).toBe(2);
      expect(resultado.products[1].precio).toBe(500);
    });
  });

  function whenSuboElArchivo(archivo: File): Promise<RespuestaCargaMasiva> {
    return firstValueFrom(service.uploadFile(archivo));
  }
});
