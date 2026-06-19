import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthSessionService } from '../services/auth-session.service';
import { environment } from '../../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuthSessionService: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    mockAuthSessionService = jasmine.createSpyObj('AuthSessionService', ['obtenerAccessTokenParaApi']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthSessionService, useValue: mockAuthSessionService },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que la url no es de API propia, no debe interceptar ni agregar headers', () => {
    const urlTercero = 'https://jsonplaceholder.typicode.com/posts';
    
    http.get(urlTercero).subscribe();

    const req = httpMock.expectOne(urlTercero);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(mockAuthSessionService.obtenerAccessTokenParaApi).not.toHaveBeenCalled();
    
    req.flush({});
  });

  it('dado que la url es de API propia y hay token, debe adjuntar el token al Header Authorization', fakeAsync(() => {
    const apiUrl = environment.apiUrl + '/test';
    mockAuthSessionService.obtenerAccessTokenParaApi.and.returnValue(Promise.resolve('token-123'));

    http.get(apiUrl).subscribe();
    tick();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  }));

  it('dado que la url es de API propia pero falla al obtener token, debe rechazar el request', fakeAsync(() => {
    const apiUrl = environment.apiUrl + '/test';
    spyOn(console, 'error');
    mockAuthSessionService.obtenerAccessTokenParaApi.and.returnValue(Promise.resolve(null));

    let errorCatch: any;

    http.get(apiUrl).subscribe({
      next: () => fail('Debió fallar'),
      error: (err) => {
        errorCatch = err;
      }
    });
    tick(); // Resuelve la promesa de cognito

    expect(errorCatch.message).toBe('No hay token de Cognito disponible');
    expect(console.error).toHaveBeenCalled();
    httpMock.expectNone(apiUrl); // Nunca debe llegar al network
  }));

  it('dado que hay un error distinto a 401, debe propagarlo sin reintentar token', fakeAsync(() => {
    const apiUrl = environment.apiUrl + '/test';
    mockAuthSessionService.obtenerAccessTokenParaApi.and.returnValue(Promise.resolve('token-123'));

    let errorCatch: any;

    http.get(apiUrl).subscribe({
      next: () => fail('Debió fallar'),
      error: (err) => {
        errorCatch = err;
      }
    });
    tick(); // Resuelve la promesa de Cognito

    const req = httpMock.expectOne(apiUrl);
    req.flush('Error de Servidor', { status: 500, statusText: 'Internal Server Error' });
    tick(); // Procesa el error

    expect(errorCatch.status).toBe(500);
    expect(mockAuthSessionService.obtenerAccessTokenParaApi).toHaveBeenCalledTimes(1);
  }));

  it('dado que hay un error 401, debe forzar refresh de token y reintentar request', fakeAsync(() => {
    const apiUrl = environment.apiUrl + '/test';
    
    // Primera llamada devuelve token expirado
    // Segunda llamada devuelve token nuevo
    mockAuthSessionService.obtenerAccessTokenParaApi.and.returnValues(
      Promise.resolve('token-viejo'),
      Promise.resolve('token-nuevo')
    );

    http.get(apiUrl).subscribe(res => {
      expect(res).toBeTruthy();
    });
    tick();

    // Simulamos que el primer request que usa token-viejo falla con 401
    const primerReq = httpMock.expectOne(apiUrl);
    expect(primerReq.request.headers.get('Authorization')).toBe('Bearer token-viejo');
    primerReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    tick();

    // Esperamos el segundo request de reintento automatico
    const reqReintento = httpMock.expectOne(apiUrl);
    expect(reqReintento.request.headers.get('Authorization')).toBe('Bearer token-nuevo');
    reqReintento.flush({ exito: true });

    // Verificamos que se haya llamado dos veces al servicio con parametros distintos
    expect(mockAuthSessionService.obtenerAccessTokenParaApi).toHaveBeenCalledTimes(2);
  }));
});
