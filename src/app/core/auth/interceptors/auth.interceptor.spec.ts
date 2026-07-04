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

  it('dado una URL externa (no API propia), deberia pasar sin autorizacion', async () => {
    const promesa = firstValueFrom(http.get(URL_EXTERNA));

    const req = httpMock.expectOne(URL_EXTERNA);
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
    await promesa;
    expect(servicioSesion.obtenerAccessTokenParaApi).not.toHaveBeenCalled();
  });

  it('dado un token disponible, deberia agregar el Authorization Bearer', async () => {
    servicioSesion.obtenerAccessTokenParaApi.and.resolveTo('token-1');

    const promesa = firstValueFrom(http.get(URL_API));
    await flushMicros();
    const req = httpMock.expectOne(URL_API);

    expect(req.request.headers.get('Authorization')).toBe('Bearer token-1');
    req.flush({});
    await promesa;
  });

  it('dado que no hay token disponible, deberia rechazar la request con el error de token', async () => {
    spyOn(console, 'error');
    servicioSesion.obtenerAccessTokenParaApi.and.resolveTo(null);

    await expectAsync(firstValueFrom(http.get(URL_API))).toBeRejectedWithError(
      /token de Cognito/,
    );
  });

  it('dado un 401, deberia reintentar la request con un token refrescado', async () => {
    servicioSesion.obtenerAccessTokenParaApi.and.returnValues(
      Promise.resolve('token-viejo'),
      Promise.resolve('token-nuevo'),
    );

    const promesa = firstValueFrom(http.get(URL_API));
    await flushMicros();
    const primerReq = httpMock.expectOne(URL_API);
    primerReq.flush('no autorizado', { status: 401, statusText: 'Unauthorized' });
    await flushMicros();

    const segundoReq = httpMock.expectOne(URL_API);
    expect(segundoReq.request.headers.get('Authorization')).toBe('Bearer token-nuevo');
    segundoReq.flush({ ok: true });

    await promesa;
  });

  it('dado que el refresh del token tampoco funciona, deberia propagar el 401 original', async () => {
    servicioSesion.obtenerAccessTokenParaApi.and.returnValues(
      Promise.resolve('token-viejo'),
      Promise.resolve(null),
    );

    const promesa = firstValueFrom(http.get(URL_API));
    await flushMicros();
    httpMock.expectOne(URL_API).flush('no autorizado', { status: 401, statusText: 'Unauthorized' });

    await expectAsync(promesa).toBeRejectedWith(jasmine.any(HttpErrorResponse));
  });

  it('dado un error != 401, no deberia reintentar', async () => {
    servicioSesion.obtenerAccessTokenParaApi.and.resolveTo('token-1');

    const promesa = firstValueFrom(http.get(URL_API));
    await flushMicros();
    httpMock.expectOne(URL_API).flush('server error', { status: 500, statusText: 'Server Error' });

    await expectAsync(promesa).toBeRejectedWith(jasmine.any(HttpErrorResponse));
    expect(servicioSesion.obtenerAccessTokenParaApi).toHaveBeenCalledTimes(1);
  });

  it('dado el dominio de inventario, deberia autenticar la request igual que la API propia', async () => {
    servicioSesion.obtenerAccessTokenParaApi.and.resolveTo('inv-token');

    const promesa = firstValueFrom(http.get('https://18-119-187-167.sslip.io/algo'));
    await flushMicros();
    const req = httpMock.expectOne('https://18-119-187-167.sslip.io/algo');

    expect(req.request.headers.get('Authorization')).toBe('Bearer inv-token');
    req.flush({});
    await promesa;
  });

  it('dado que new URL tira excepcion, deberia caer al fallback con startsWith y autenticar igual', async () => {
    servicioSesion.obtenerAccessTokenParaApi.and.resolveTo('token-fallback');
    const originalURL = window.URL;
    (window as unknown as { URL: unknown }).URL = function () { throw new Error('URL invalido'); };

    try {
      const promesa = firstValueFrom(http.get(URL_API));
      await flushMicros();
      const req = httpMock.expectOne(URL_API);

      expect(req.request.headers.get('Authorization')).toBe('Bearer token-fallback');
      req.flush({});
      await promesa;
    } finally {
      (window as unknown as { URL: unknown }).URL = originalURL;
    }
  });

  it('dado que new URL falla y la URL es del dominio de inventario, el fallback deberia autenticarla', async () => {
    servicioSesion.obtenerAccessTokenParaApi.and.resolveTo('inv-fallback');
    const originalURL = window.URL;
    (window as unknown as { URL: unknown }).URL = function () { throw new Error('URL invalido'); };
    const URL_INV = 'https://18-119-187-167.sslip.io/algo';

    try {
      const promesa = firstValueFrom(http.get(URL_INV));
      await flushMicros();
      const req = httpMock.expectOne(URL_INV);

      expect(req.request.headers.get('Authorization')).toBe('Bearer inv-fallback');
      req.flush({});
      await promesa;
    } finally {
      (window as unknown as { URL: unknown }).URL = originalURL;
    }
  });

  async function flushMicros(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }
});
