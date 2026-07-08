import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Messaging } from '@angular/fire/messaging';
import { environment } from '../../../environments/environment';
import { NotificacionesService } from '../../data-access/services/notificaciones.service';
import { NotificacionSaldoBajoService } from '../../shared/components/notifications/notificacion-saldo-bajo/notificacion-saldo-bajo.service';
import { NotificacionSugerenciaSaludableService } from '../../shared/components/notifications/notificacion-sugerencia-saludable/notificacion-sugerencia-saludable.service';
import { NotificationService } from './notification.service';

interface ServicioInterno {
  handleTokenRegistration: () => void;
  listenToForegroundMessages: () => void;
  sendTokenToBackend: (token: string) => void;
}

type PermisoNotificacion = 'granted' | 'denied' | 'default';

describe('NotificationService', () => {
  const URL_DISPOSITIVOS = `${environment.apiUrl}/dispositivos`;

  let service: NotificationService;
  let interno: ServicioInterno;
  let httpMock: HttpTestingController;
  let servicioSaldoBajo: jasmine.SpyObj<NotificacionSaldoBajoService>;
  let servicioSugerencia: jasmine.SpyObj<NotificacionSugerenciaSaludableService>;
  let servicioNotif: jasmine.SpyObj<NotificacionesService>;
  let requestPermissionSpy: jasmine.Spy;
  const originalNotification = window.Notification;

  beforeEach(() => {
    servicioSaldoBajo = jasmine.createSpyObj<NotificacionSaldoBajoService>(
      'NotificacionSaldoBajoService',
      ['mostrar'],
    );
    servicioSugerencia = jasmine.createSpyObj<NotificacionSugerenciaSaludableService>(
      'NotificacionSugerenciaSaludableService',
      ['mostrar'],
    );
    servicioNotif = jasmine.createSpyObj<NotificacionesService>(
      'NotificacionesService',
      ['agregarNotificacion', 'obtenerNotificaciones'],
    );

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Messaging, useValue: {} },
        { provide: NotificacionSaldoBajoService, useValue: servicioSaldoBajo },
        { provide: NotificacionSugerenciaSaludableService, useValue: servicioSugerencia },
        { provide: NotificacionesService, useValue: servicioNotif },
      ],
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    interno = service as unknown as ServicioInterno;

    requestPermissionSpy = jasmine.createSpy('requestPermission');
    (window as unknown as { Notification: { requestPermission: jasmine.Spy } }).Notification = {
      requestPermission: requestPermissionSpy,
    };
  });

  afterEach(() => {
    httpMock.verify();
    (window as unknown as { Notification: unknown }).Notification = originalNotification;
  });

  describe('inicializacion', () => {
    it('dado el service inyectado, cuando lo consulto, deberia crearse correctamente', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('requestNotificationPermission', () => {
    it('dado permission granted, cuando pido permiso, deberia registrar el token y escuchar foreground', async () => {
      givenPermisoDeNotificacion('granted');
      const spyRegistrar = spyOn(interno, 'handleTokenRegistration');
      const spyEscuchar = spyOn(interno, 'listenToForegroundMessages');

      await whenPidoPermiso();

      expect(requestPermissionSpy).toHaveBeenCalled();
      expect(spyRegistrar).toHaveBeenCalled();
      expect(spyEscuchar).toHaveBeenCalled();
    });

    it('dado permission denied, cuando pido permiso, no deberia registrar el token pero si escuchar foreground', async () => {
      givenPermisoDeNotificacion('denied');
      const spyRegistrar = spyOn(interno, 'handleTokenRegistration');
      const spyEscuchar = spyOn(interno, 'listenToForegroundMessages');

      await whenPidoPermiso();

      expect(spyRegistrar).not.toHaveBeenCalled();
      expect(spyEscuchar).toHaveBeenCalled();
    });

    it('dado permission default, cuando pido permiso, no deberia registrar el token pero si escuchar foreground', async () => {
      givenPermisoDeNotificacion('default');
      const spyRegistrar = spyOn(interno, 'handleTokenRegistration');
      const spyEscuchar = spyOn(interno, 'listenToForegroundMessages');

      await whenPidoPermiso();

      expect(spyRegistrar).not.toHaveBeenCalled();
      expect(spyEscuchar).toHaveBeenCalled();
    });
  });

  describe('sendTokenToBackend', () => {
    it('dado un token, cuando lo mando al back, deberia hacer POST /dispositivos con el fcmToken', () => {
      spyOn(console, 'log');

      whenMandoTokenAlBackend('token-123');

      const req = httpMock.expectOne(URL_DISPOSITIVOS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ fcmToken: 'token-123' });
      req.flush({});
      expect(console.log).toHaveBeenCalledWith(jasmine.stringMatching(/FCM Token registrado/i));
    });

    it('dado que el POST falla, cuando lo mando al back, deberia loguear el error', () => {
      spyOn(console, 'error');

      whenMandoTokenAlBackend('token-fail');

      httpMock.expectOne(URL_DISPOSITIVOS).flush('boom', {
        status: 500,
        statusText: 'Server Error',
      });

      expect(console.error).toHaveBeenCalledWith(
        jasmine.stringMatching(/Error registrando FCM/i),
        jasmine.anything(),
      );
    });
  });

  function givenPermisoDeNotificacion(estado: PermisoNotificacion): void {
    requestPermissionSpy.and.resolveTo(estado);
  }

  async function whenPidoPermiso(): Promise<void> {
    service.requestNotificationPermission();
    await Promise.resolve();
  }

  function whenMandoTokenAlBackend(token: string): void {
    interno.sendTokenToBackend(token);
  }
});
