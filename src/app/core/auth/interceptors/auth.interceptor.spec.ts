import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../services/auth-session.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const URL_API = `${environment.apiUrl}/algo`;
  const URL_EXTERNA = 'https://otro-servidor.com/x';
  const URL_INVENTARIO = 'https://18-119-187-167.sslip.io/algo';

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let servicioSesion: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    servicioSesion = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'obtenerAccessTokenParaApi',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: servicioSesion },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('dado una URL externa (no API propia), cuando hago request, deberia pasar sin autorizacion', async () => {
    const promesa = whenHagoGet(URL_EXTERNA);

    const req = httpMock.expectOne(URL_EXTERNA);
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
    await promesa;
    expect(servicioSesion.obtenerAccessTokenParaApi).not.toHaveBeenCalled();
  });

  it('dado un token disponible, cuando hago request a la API, deberia agregar el Authorization Bearer', async () => {
    givenTokensDisponibles('token-1');

    const promesa = whenHagoGet(URL_API);
    await flushMicros();
    const req = httpMock.expectOne(URL_API);

    expect(req.request.headers.get('Authorization')).toBe('Bearer token-1');
    req.flush({});
    await promesa;
  });

  it('dado que no hay token disponible, cuando hago request, deberia rechazar con el error de token', async () => {
    spyOn(console, 'error');
    givenTokensDisponibles(null);

    await expectAsync(whenHagoGet(URL_API)).toBeRejectedWithError(/token de Cognito/);
  });

  it('dado un 401, cuando hago request, deberia reintentar con un token refrescado', async () => {
    givenTokensDisponibles('token-viejo', 'token-nuevo');

    const promesa = whenHagoGet(URL_API);
    await flushMicros();
    const primerReq = httpMock.expectOne(URL_API);
    primerReq.flush('no autorizado', { status: 401, statusText: 'Unauthorized' });
    await flushMicros();

    const segundoReq = httpMock.expectOne(URL_API);
    expect(segundoReq.request.headers.get('Authorization')).toBe('Bearer token-nuevo');
    segundoReq.flush({ ok: true });

    await promesa;
  });

  it('dado que el refresh del token tampoco funciona, cuando hago request, deberia propagar el 401 original', async () => {
    givenTokensDisponibles('token-viejo', null);

    const promesa = whenHagoGet(URL_API);
    await flushMicros();
    httpMock.expectOne(URL_API).flush('no autorizado', { status: 401, statusText: 'Unauthorized' });

    await expectAsync(promesa).toBeRejectedWith(jasmine.any(HttpErrorResponse));
  });

  it('dado un error != 401, cuando hago request, no deberia reintentar', async () => {
    givenTokensDisponibles('token-1');

    const promesa = whenHagoGet(URL_API);
    await flushMicros();
    httpMock.expectOne(URL_API).flush('server error', { status: 500, statusText: 'Server Error' });

    await expectAsync(promesa).toBeRejectedWith(jasmine.any(HttpErrorResponse));
    expect(servicioSesion.obtenerAccessTokenParaApi).toHaveBeenCalledTimes(1);
  });

  it('dado el dominio de inventario, cuando hago request, deberia autenticar como la API propia', async () => {
    givenTokensDisponibles('inv-token');

    const promesa = whenHagoGet(URL_INVENTARIO);
    await flushMicros();
    const req = httpMock.expectOne(URL_INVENTARIO);

    expect(req.request.headers.get('Authorization')).toBe('Bearer inv-token');
    req.flush({});
    await promesa;
  });

  it('dado que new URL tira excepcion, cuando hago request a la API propia, el fallback deberia autenticarla', async () => {
    givenTokensDisponibles('token-fallback');
    const originalURL = window.URL;
    givenNewUrlRompe();

    try {
      const promesa = whenHagoGet(URL_API);
      await flushMicros();
      const req = httpMock.expectOne(URL_API);

      expect(req.request.headers.get('Authorization')).toBe('Bearer token-fallback');
      req.flush({});
      await promesa;
    } finally {
      (window as unknown as { URL: unknown }).URL = originalURL;
    }
  });

  it('dado que new URL falla y la URL es del dominio de inventario, cuando hago request, el fallback deberia autenticarla', async () => {
    givenTokensDisponibles('inv-fallback');
    const originalURL = window.URL;
    givenNewUrlRompe();

    try {
      const promesa = whenHagoGet(URL_INVENTARIO);
      await flushMicros();
      const req = httpMock.expectOne(URL_INVENTARIO);

      expect(req.request.headers.get('Authorization')).toBe('Bearer inv-fallback');
      req.flush({});
      await promesa;
    } finally {
      (window as unknown as { URL: unknown }).URL = originalURL;
    }
  });

  it('dado un POST a /school-registrations, cuando hago request, no deberia pedir token ni agregar Authorization', async () => {
    const url = `${environment.apiUrl}/school-registrations`;

    const promesa = firstValueFrom(http.post(url, { nombre: 'colegio' }));
    const req = httpMock.expectOne(url);

    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
    await promesa;
    expect(servicioSesion.obtenerAccessTokenParaApi).not.toHaveBeenCalled();
  });

  it('dado un POST a /invitaciones/tutor/{token}/preparar-cuenta, no deberia pedir token ni agregar Authorization', async () => {
    const url = `${environment.apiUrl}/invitaciones/tutor/tok-1/preparar-cuenta`;

    const promesa = firstValueFrom(http.post(url, {}));
    const req = httpMock.expectOne(url);

    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
    await promesa;
    expect(servicioSesion.obtenerAccessTokenParaApi).not.toHaveBeenCalled();
  });

  function givenTokensDisponibles(...tokens: (string | null)[]): void {
    servicioSesion.obtenerAccessTokenParaApi.and.returnValues(
      ...tokens.map((t) => Promise.resolve(t)),
    );
  }

  function givenNewUrlRompe(): void {
    (window as unknown as { URL: unknown }).URL = function () {
      throw new Error('URL invalido');
    };
  }

  function whenHagoGet(url: string): Promise<unknown> {
    return firstValueFrom(http.get(url));
  }

  async function flushMicros(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }
});
