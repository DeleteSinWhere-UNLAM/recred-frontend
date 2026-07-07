import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  CrearPagoSuscripcionColegioResponse,
  CrearSuscripcionUsuarioResponse,
  SubscriptionPaymentService,
} from './subscription-payment.service';

describe('SubscriptionPaymentService', () => {
  const URL_USER_SUBSCRIPTION = `${environment.apiUrl}/payments/subscriptions/user`;
  const URL_SCHOOL_SUBSCRIPTION_PAYMENT = `${environment.apiUrl}/payments/subscriptions/school`;

  let service: SubscriptionPaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubscriptionPaymentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SubscriptionPaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado una suscripcion de usuario, cuando la creo, deberia hacer POST con usuarioId plan y periodo', async () => {
    const promise = service.crearSuscripcionUsuario({
      usuarioId: 'usuario-1',
      plan: 'AVANZADO',
      periodo: 'ANUAL',
    });

    const req = httpMock.expectOne(URL_USER_SUBSCRIPTION);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      usuarioId: 'usuario-1',
      plan: 'AVANZADO',
      periodo: 'ANUAL',
    });

    const respuesta = crearRespuesta();
    req.flush(respuesta);

    await expectAsync(promise).toBeResolvedTo(respuesta);
  });

  it('dado un colegio, cuando creo el pago de licencia, deberia hacer POST a payments/subscriptions/school', async () => {
    const promise = service.crearPagoSuscripcionColegio({
      colegioId: 'colegio-1',
    });

    const req = httpMock.expectOne(URL_SCHOOL_SUBSCRIPTION_PAYMENT);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      colegioId: 'colegio-1',
    });

    const respuesta = crearRespuestaColegio();
    req.flush(respuesta);

    await expectAsync(promise).toBeResolvedTo(respuesta);
  });

  function crearRespuesta(
    override: Partial<CrearSuscripcionUsuarioResponse> = {},
  ): CrearSuscripcionUsuarioResponse {
    return {
      paymentUrl: 'https://www.mercadopago.com/checkout',
      plan: 'AVANZADO',
      periodo: 'ANUAL',
      price: 120000,
      currency: 'ARS',
      ...override,
    };
  }

  function crearRespuestaColegio(
    override: Partial<CrearPagoSuscripcionColegioResponse> = {},
  ): CrearPagoSuscripcionColegioResponse {
    return {
      paymentUrl: 'https://www.mercadopago.com/school-checkout',
      price: 20,
      currency: 'USD',
      ...override,
    };
  }
});
