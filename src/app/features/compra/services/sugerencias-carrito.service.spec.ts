import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SugerenciaCarritoMother } from '../compra.mother';
import { SugerenciaCarrito, SugerenciaCarritoRequest } from '../models/sugerencia-carrito.model';
import { SugerenciasCarritoService } from './sugerencias-carrito.service';

describe('SugerenciasCarritoService', () => {
  const URL_CART_SUGGESTIONS = `${environment.apiUrl}/cart-suggestions`;

  let service: SugerenciasCarritoService;
  let httpMock: HttpTestingController;

  class SugerenciaCarritoRequestMother {
    static crear(override: Partial<SugerenciaCarritoRequest> = {}): SugerenciaCarritoRequest {
      return {
        studentId: 'alumno-1',
        buffetId: 'buffet-1',
        items: [{ productId: 'prod-1', quantity: 2 }],
        limit: 5,
        ...override,
      };
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SugerenciasCarritoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SugerenciasCarritoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('obtenerSugerencias', () => {
    it('dado un request con studentId, buffetId e items, cuando pido sugerencias, deberia hacer POST /cart-suggestions con el body', async () => {
      const request = SugerenciaCarritoRequestMother.crear();
      const sugerencias = [SugerenciaCarritoMother.crear()];

      const promesa = whenPidoSugerencias(request);
      const req = httpMock.expectOne(URL_CART_SUGGESTIONS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(sugerencias);

      expect(await promesa).toEqual(sugerencias);
    });

    it('dado que el back devuelve error, cuando pido sugerencias, deberia rechazar la promesa', async () => {
      const promesa = whenPidoSugerencias(
        SugerenciaCarritoRequestMother.crear({ items: [], limit: undefined }),
      );
      httpMock.expectOne(URL_CART_SUGGESTIONS).flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  function whenPidoSugerencias(request: SugerenciaCarritoRequest): Promise<SugerenciaCarrito[]> {
    return firstValueFrom(service.obtenerSugerencias(request));
  }
});
