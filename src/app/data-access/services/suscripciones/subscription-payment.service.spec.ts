import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  CrearPagoSuscripcionColegioResponse,
  CrearSuscripcionUsuarioResponse,
  SubscriptionPaymentService,
} from './subscription-payment.service';

class CrearSuscripcionUsuarioResponseMother {
  static crear(
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
}

class CrearPagoSuscripcionColegioResponseMother {
  static crear(
    override: Partial<CrearPagoSuscripcionColegioResponse> = {},
  ): CrearPagoSuscripcionColegioResponse {
    return {
      paymentUrl: 'https://www.mercadopago.com/school-checkout',
      price: 20,
      currency: 'USD',
      ...override,
    };
  }
}

describe('SubscriptionPaymentService', () => {
  const URL_USER_SUBSCRIPTION = `${environment.apiUrl}/payments/subscriptions/user`;
  const URL_SCHOOL_SUBSCRIPTION_PAYMENT = `${environment.apiUrl}/payments/subscriptions/school`;
  const URL_USER_TRIAL = `${environment.apiUrl}/payments/subscriptions/user/trial`;

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
    const respuesta = CrearSuscripcionUsuarioResponseMother.crear();

    const promise = whenCreoSuscripcionUsuario({
      usuarioId: 'usuario-1',
      plan: 'AVANZADO',
      periodo: 'ANUAL',
    });

    thenSeHizoPostA(URL_USER_SUBSCRIPTION, {
      usuarioId: 'usuario-1',
      plan: 'AVANZADO',
      periodo: 'ANUAL',
    }).flush(respuesta);
    await thenLaPromesaResuelveA(promise, respuesta);
  });

  it('dado un colegio, cuando creo el pago de licencia, deberia hacer POST a payments/subscriptions/school', async () => {
    const respuesta = CrearPagoSuscripcionColegioResponseMother.crear();

    const promise = whenCreoPagoSuscripcionColegio({ colegioId: 'colegio-1' });

    thenSeHizoPostA(URL_SCHOOL_SUBSCRIPTION_PAYMENT, { colegioId: 'colegio-1' }).flush(respuesta);
    await thenLaPromesaResuelveA(promise, respuesta);
  });

  it('dado una activacion de prueba de usuario, cuando la solicito, deberia hacer POST con usuarioId y plan', async () => {
    const respuesta = { success: true };

    const promise = whenActivoPruebaUsuario({ usuarioId: 'usuario-1', plan: 'AVANZADO' });

    thenSeHizoPostA(URL_USER_TRIAL, { usuarioId: 'usuario-1', plan: 'AVANZADO' }).flush(respuesta);
    await thenLaPromesaResuelveA(promise, respuesta);
  });

  function whenCreoSuscripcionUsuario(
    payload: Parameters<SubscriptionPaymentService['crearSuscripcionUsuario']>[0],
  ): Promise<CrearSuscripcionUsuarioResponse> {
    return service.crearSuscripcionUsuario(payload);
  }

  function whenCreoPagoSuscripcionColegio(
    payload: Parameters<SubscriptionPaymentService['crearPagoSuscripcionColegio']>[0],
  ): Promise<CrearPagoSuscripcionColegioResponse> {
    return service.crearPagoSuscripcionColegio(payload);
  }

  function whenActivoPruebaUsuario(
    payload: Parameters<SubscriptionPaymentService['activarPruebaUsuario']>[0],
  ): Promise<unknown> {
    return service.activarPruebaUsuario(payload);
  }

  function thenSeHizoPostA(url: string, body: unknown): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    return req;
  }

  async function thenLaPromesaResuelveA<T>(promise: Promise<T>, esperado: T): Promise<void> {
    await expectAsync(promise).toBeResolvedTo(esperado);
  }
});
