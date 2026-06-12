import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AcreditarMercadoPagoService } from './acreditar-mercado-pago.service';
import { environment } from '../../../../environments/environment';

describe('AcreditarMercadoPagoService', () => {
  let service: AcreditarMercadoPagoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AcreditarMercadoPagoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AcreditarMercadoPagoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('Dado que se llama a generarLinkPago, debería hacer un POST a la API de payments y retornar el paymentUrl', async () => {
    const studentId = 'student-123';
    const amount = 1000;
    const mockResponse = { paymentUrl: 'https://mp.com/pay' };

    const promise = service.generarLinkPago(studentId, amount);

    const req = httpMock.expectOne(`${environment.apiUrl}/payments/topup`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ studentId, amount });
    
    req.flush(mockResponse);

    const paymentUrl = await promise;
    expect(paymentUrl).toBe('https://mp.com/pay');
  });
});
