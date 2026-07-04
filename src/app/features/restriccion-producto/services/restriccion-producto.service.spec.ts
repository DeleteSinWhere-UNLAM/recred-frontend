import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RestriccionProductoService } from './restriccion-producto.service';

describe('RestriccionProductoService', () => {
  const ALUMNO_ID = 'alumno-123';
  const PRODUCTO_ID = 'producto-456';
  const URL = `${environment.apiUrl}/control-parental/alumnos/${ALUMNO_ID}/productos-bloqueados/${PRODUCTO_ID}`;

  let service: RestriccionProductoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestriccionProductoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RestriccionProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('bloquearProducto', () => {
    it('dado un alumnoId y un productoId, cuando bloqueo, deberia hacer POST al endpoint de control-parental con body vacio', async () => {
      const promesa = firstValueFrom(service.bloquearProducto(ALUMNO_ID, PRODUCTO_ID));

      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);

      await promesa;
    });
  });

  describe('desbloquearProducto', () => {
    it('dado un alumnoId y un productoId, cuando desbloqueo, deberia hacer DELETE al mismo endpoint', async () => {
      const promesa = firstValueFrom(service.desbloquearProducto(ALUMNO_ID, PRODUCTO_ID));

      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await promesa;
    });
  });
});
