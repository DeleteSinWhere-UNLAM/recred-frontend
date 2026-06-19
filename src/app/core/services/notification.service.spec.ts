import { TestBed, fakeAsync } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { Messaging } from '@angular/fire/messaging';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificacionSaldoBajoService } from '../../shared/components/notifications/notificacion-saldo-bajo/notificacion-saldo-bajo.service';
import { NotificacionSugerenciaSaludableService } from '../../shared/components/notifications/notificacion-sugerencia-saludable/notificacion-sugerencia-saludable.service';
import { NotificacionesService } from '../../data-access/services/notificaciones.service';
import { environment } from '../../../environments/environment';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpTestingController: HttpTestingController;
  let notificacionSaldoBajoSpy: jasmine.SpyObj<NotificacionSaldoBajoService>;
  let notificacionSugerenciaSaludableSpy: jasmine.SpyObj<NotificacionSugerenciaSaludableService>;
  let notificacionesServiceSpy: jasmine.SpyObj<NotificacionesService>;

  beforeEach(() => {
    const saldoBajoSpy = jasmine.createSpyObj('NotificacionSaldoBajoService', ['mostrar']);
    const sugerenciaSpy = jasmine.createSpyObj('NotificacionSugerenciaSaludableService', ['mostrar']);
    const notifSpy = jasmine.createSpyObj('NotificacionesService', ['agregarNotificacion']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationService,
        { provide: Messaging, useValue: {} },
        { provide: NotificacionSaldoBajoService, useValue: saldoBajoSpy },
        { provide: NotificacionSugerenciaSaludableService, useValue: sugerenciaSpy },
        { provide: NotificacionesService, useValue: notifSpy }
      ]
    });

    service = TestBed.inject(NotificationService);
    httpTestingController = TestBed.inject(HttpTestingController);
    notificacionSaldoBajoSpy = TestBed.inject(NotificacionSaldoBajoService) as jasmine.SpyObj<NotificacionSaldoBajoService>;
    notificacionSugerenciaSaludableSpy = TestBed.inject(NotificacionSugerenciaSaludableService) as jasmine.SpyObj<NotificacionSugerenciaSaludableService>;
    notificacionesServiceSpy = TestBed.inject(NotificacionesService) as jasmine.SpyObj<NotificacionesService>;

    spyOn(console, 'log');
    spyOn(console, 'warn');
    spyOn(console, 'error');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se crea el servicio, debe estar definido', () => {
    expect(service).toBeTruthy();
  });

  describe('requestNotificationPermission', () => {
    it('dado que se otorga permiso, debe llamar a handleTokenRegistration y listenToForegroundMessages', fakeAsync(() => {
      spyOn(window.Notification, 'requestPermission').and.returnValue(Promise.resolve('granted'));
      spyOn(service, 'handleTokenRegistration');
      spyOn<unknown>(service, 'listenToForegroundMessages');

      service.requestNotificationPermission();
      tick();

      expect(service.handleTokenRegistration).toHaveBeenCalled();
      expect(service['listenToForegroundMessages']).toHaveBeenCalled();
    }));

    it('dado que se deniega el permiso, no debe llamar a handleTokenRegistration pero si a listenToForegroundMessages', fakeAsync(() => {
      spyOn(window.Notification, 'requestPermission').and.returnValue(Promise.resolve('denied'));
      spyOn(service, 'handleTokenRegistration');
      spyOn<unknown>(service, 'listenToForegroundMessages');

      service.requestNotificationPermission();
      tick();

      expect(service.handleTokenRegistration).not.toHaveBeenCalled();
      expect(service['listenToForegroundMessages']).toHaveBeenCalled();
    }));
  });

  describe('handleTokenRegistration', () => {
    it('dado que se obtiene un nuevo token, debe enviarlo al backend y guardarlo en localStorage', fakeAsync(() => {
      spyOn(service.firebase, 'getToken').and.returnValue(Promise.resolve('nuevo-token'));
      spyOn(localStorage, 'getItem').and.returnValue('viejo-token');
      spyOn(localStorage, 'setItem');
      spyOn<unknown>(service, 'sendTokenToBackend');

      service.handleTokenRegistration();
      tick();

      expect(service['sendTokenToBackend']).toHaveBeenCalledWith('nuevo-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('fcm_token', 'nuevo-token');
    }));

    it('dado que se obtiene el mismo token que ya existe, no debe enviarlo al backend', fakeAsync(() => {
      spyOn(service.firebase, 'getToken').and.returnValue(Promise.resolve('mismo-token'));
      spyOn(localStorage, 'getItem').and.returnValue('mismo-token');
      spyOn<unknown>(service, 'sendTokenToBackend');

      service.handleTokenRegistration();
      tick();

      expect(service['sendTokenToBackend']).not.toHaveBeenCalled();
    }));

    it('dado que no se obtiene token, no debe hacer nada', fakeAsync(() => {
      spyOn(service.firebase, 'getToken').and.returnValue(Promise.resolve(''));
      spyOn<unknown>(service, 'sendTokenToBackend');

      service.handleTokenRegistration();
      tick();

      expect(service['sendTokenToBackend']).not.toHaveBeenCalled();
    }));

    it('dado que falla al obtener el token, debe capturar el error', fakeAsync(() => {
      const error = new Error('Error token');
      spyOn(service.firebase, 'getToken').and.returnValue(Promise.reject(_error));

      service.handleTokenRegistration();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error al obtener FCM token:', error);
    }));
  });

  describe('listenToForegroundMessages', () => {
    let onMessageCallback: (payload: unknown) => void;

    beforeEach(() => {
      spyOn(service.firebase, 'onMessage').and.callFake((messaging: unknown, cb: unknown) => {
        onMessageCallback = cb;
        return () => { return; };
      });
      service['listenToForegroundMessages']();
    });

    it('dado que se recibe una notificacion sin data, debe agregar una notificacion simple', () => {
      const payload = {
        notification: { title: 'Titulo Test', body: 'Cuerpo Test' }
      };

      onMessageCallback(payload);

      expect(notificacionesServiceSpy.agregarNotificacion).toHaveBeenCalledWith(jasmine.objectContaining({
        titulo: 'Titulo Test',
        mensaje: 'Cuerpo Test'
      }));
    });

    it('dado que se recibe una notificacion vacia, debe agregar notificacion simple con defaults', () => {
      const payload = {};

      onMessageCallback(payload);

      expect(notificacionesServiceSpy.agregarNotificacion).toHaveBeenCalledWith(jasmine.objectContaining({
        titulo: 'Nueva notificación',
        mensaje: ''
      }));
    });

    it('dado que se recibe alerta de saldo bajo para PADRE, debe agregarla y llamar al servicio de saldo bajo', () => {
      const payload = {
        data: { type: 'LOW_BALANCE_ALERT', rol: 'PADRE', balance: '100', alumnoId: 'alumno1', titulo: 'Saldo', mensaje: 'Bajo' }
      };

      onMessageCallback(payload);

      expect(notificacionesServiceSpy.agregarNotificacion).toHaveBeenCalledWith(jasmine.objectContaining({
        tipo: 'LOW_BALANCE_ALERT'
      }));
      expect(notificacionSaldoBajoSpy.mostrar).toHaveBeenCalledWith(100, 'alumno1');
    });

    it('dado que se recibe sugerencia de compra, debe agregarla y llamar al servicio de sugerencia', () => {
      const payload = {
        data: {
          type: 'PURCHASE_SUGGESTION',
          rol: 'ALUMNO',
          sugerenciaId: 'sug1',
          titulo: 'Sugerencia',
          mensaje: 'Compra esto',
          producto: '{"id":"prod1","nombre":"Manzana"}',
          alumnoId: 'alumno2'
        }
      };

      onMessageCallback(payload);

      expect(notificacionesServiceSpy.agregarNotificacion).toHaveBeenCalledWith(jasmine.objectContaining({
        tipo: 'PURCHASE_SUGGESTION'
      }));
      expect(notificacionSugerenciaSaludableSpy.mostrar).toHaveBeenCalledWith(
        'sug1', 'Sugerencia', 'Compra esto', { id: 'prod1', nombre: 'Manzana' } as unknown, 'alumno2'
      );
    });

    it('dado que se recibe sugerencia de compra y el parseo del producto falla, debe capturar el error', () => {
      const payload = {
        data: {
          type: 'PURCHASE_SUGGESTION',
          rol: 'PADRE', // trigger warn
          producto: 'invalid-json'
        }
      };

      onMessageCallback(payload);

      expect(console.warn).toHaveBeenCalledWith('Advertencia: El rol no es ALUMNO, es:', 'PADRE');
      expect(console.error).toHaveBeenCalledWith('Error parseando el producto sugerido', jasmine.any(SyntaxError));
      expect(notificacionSugerenciaSaludableSpy.mostrar).not.toHaveBeenCalled();
    });

    it('dado que la sugerencia tiene un producto que ya es un objeto, no debe parsearlo y llamar al servicio de sugerencia', () => {
      const payload = {
        data: {
          type: 'PURCHASE_SUGGESTION',
          rol: 'ALUMNO',
          producto: { id: 'prod2', nombre: 'Pera' }
        }
      };

      onMessageCallback(payload);

      expect(notificacionSugerenciaSaludableSpy.mostrar).toHaveBeenCalledWith(
        undefined as unknown, undefined as unknown, undefined as unknown, { id: 'prod2', nombre: 'Pera' } as unknown, undefined as unknown
      );
    });
  });

  describe('sendTokenToBackend', () => {
    it('dado que la peticion es exitosa, debe registrar el log correspondiente', () => {
      service['sendTokenToBackend']('token-123');

      const req = httpTestingController.expectOne(`${environment.apiUrl}/dispositivos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ fcmToken: 'token-123' });

      req.flush({});
      expect(console.log).toHaveBeenCalledWith('FCM Token registrado exitosamente en el backend.');
    });

    it('dado que la peticion falla, debe capturar el error', () => {
      service['sendTokenToBackend']('token-123');

      const req = httpTestingController.expectOne(`${environment.apiUrl}/dispositivos`);
      
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      expect(console.error).toHaveBeenCalledWith('Error registrando FCM token en backend:', jasmine.any(Object));
    });
  });
});
