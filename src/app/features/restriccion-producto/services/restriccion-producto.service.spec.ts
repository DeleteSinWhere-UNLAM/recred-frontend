import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RestriccionProductoService } from './restriccion-producto.service';

describe('RestriccionProductoService', () => {
  const ALUMNO_ID = 'alumno-123';
  const PRODUCTO_ID = 'producto-456';
  const URL_PRODUCTO_BLOQUEADO = (alumnoId: string, productoId: string): string =>
    `${environment.apiUrl}/control-parental/alumnos/${alumnoId}/productos-bloqueados/${productoId}`;

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
      const promesa = whenBloqueoProducto(ALUMNO_ID, PRODUCTO_ID);

      thenSeHizoPOSTBloquearProducto(ALUMNO_ID, PRODUCTO_ID).flush(null);

      await promesa;
    });
  });

  describe('desbloquearProducto', () => {
    it('dado un alumnoId y un productoId, cuando desbloqueo, deberia hacer DELETE al mismo endpoint', async () => {
      const promesa = whenDesbloqueoProducto(ALUMNO_ID, PRODUCTO_ID);

      thenSeHizoDELETEDesbloquearProducto(ALUMNO_ID, PRODUCTO_ID).flush(null);

      await promesa;
    });
  });

  function whenBloqueoProducto(alumnoId: string, productoId: string): Promise<void> {
    return firstValueFrom(service.bloquearProducto(alumnoId, productoId));
  }

  function whenDesbloqueoProducto(alumnoId: string, productoId: string): Promise<void> {
    return firstValueFrom(service.desbloquearProducto(alumnoId, productoId));
  }

  function thenSeHizoPOSTBloquearProducto(alumnoId: string, productoId: string): TestRequest {
    const req = httpMock.expectOne(URL_PRODUCTO_BLOQUEADO(alumnoId, productoId));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    return req;
  }

  function thenSeHizoDELETEDesbloquearProducto(alumnoId: string, productoId: string): TestRequest {
    const req = httpMock.expectOne(URL_PRODUCTO_BLOQUEADO(alumnoId, productoId));
    expect(req.request.method).toBe('DELETE');
    return req;
  }
});
