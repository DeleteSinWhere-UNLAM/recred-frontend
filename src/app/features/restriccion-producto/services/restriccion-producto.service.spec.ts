import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { RestriccionProductoService } from './restriccion-producto.service';

describe('RestriccionProductoService', () => {
  let service: RestriccionProductoService;
  let httpMock: HttpTestingController;

  const apiBase = environment.apiUrl;
  const alumnoId = 'alumno-123';
  const productoId = 'producto-456';

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

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('bloquearProducto debería enviar una petición POST al endpoint correcto', (done) => {
    service.bloquearProducto(alumnoId, productoId).subscribe({
      next: () => {
        done();
      }
    });

    const req = httpMock.expectOne(
      `${apiBase}/control-parental/alumnos/${alumnoId}/productos-bloqueados/${productoId}`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('desbloquearProducto debería enviar una petición DELETE al endpoint correcto', (done) => {
    service.desbloquearProducto(alumnoId, productoId).subscribe({
      next: () => {
        done();
      }
    });

    const req = httpMock.expectOne(
      `${apiBase}/control-parental/alumnos/${alumnoId}/productos-bloqueados/${productoId}`
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
