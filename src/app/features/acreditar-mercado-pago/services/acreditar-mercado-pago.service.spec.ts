import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { TopupResponse, TopupResponseMother } from '../acreditar-mercado-pago.mother';
import { AcreditarMercadoPagoService } from './acreditar-mercado-pago.service';

describe('AcreditarMercadoPagoService', () => {
  const URL_TOPUP = `${environment.apiUrl}/payments/topup`;

  let service: AcreditarMercadoPagoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AcreditarMercadoPagoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AcreditarMercadoPagoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('generarLinkPago', () => {
    it('dado un alumnoId y un monto, cuando llamo al service, deberia hacer POST /payments/topup con el body esperado', async () => {
      const promise = whenGeneroLinkPago('alumno-1', 1500);

      const req = thenSeHaceUnPostA(URL_TOPUP);
      expect(req.request.body).toEqual({ studentId: 'alumno-1', amount: 1500 });

      req.flush(TopupResponseMother.crear());
      await promise;
    });

    it('dado que el back devuelve un paymentUrl, cuando llamo al service, deberia resolver con esa URL', async () => {
      const promise = whenGeneroLinkPago('alumno-1', 1500);
      givenElBackResponde(TopupResponseMother.crear({ paymentUrl: 'https://mp.com/checkout/abc' }));

      const url = await promise;
      expect(url).toBe('https://mp.com/checkout/abc');
    });
  });

  function whenGeneroLinkPago(alumnoId: string, monto: number): Promise<string> {
    return service.generarLinkPago(alumnoId, monto);
  }

  function givenElBackResponde(respuesta: TopupResponse): void {
    const req = httpMock.expectOne(URL_TOPUP);
    req.flush(respuesta);
  }

  function thenSeHaceUnPostA(url: string) {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    return req;
  }
});
