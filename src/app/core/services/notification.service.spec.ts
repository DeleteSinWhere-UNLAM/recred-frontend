import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Messaging } from '@angular/fire/messaging';
import { NotificacionSaldoBajoService } from '../../shared/components/notifications/notificacion-saldo-bajo/notificacion-saldo-bajo.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let notificacionServiceSpy: jasmine.SpyObj<NotificacionSaldoBajoService>;

  beforeEach(() => {
    notificacionServiceSpy = jasmine.createSpyObj('NotificacionSaldoBajoService', ['mostrar']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Messaging, useValue: {} },
        { provide: NotificacionSaldoBajoService, useValue: notificacionServiceSpy }
      ]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que se inicializa el servicio, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  // Nota: testear a fondo métodos como requestNotificationPermission o listenToForegroundMessages
  // que usan métodos exportados directamente (getToken, onMessage) de @angular/fire/messaging
  // requiere configuración de mocks a nivel de módulo (esbuild/jest), por lo que acá verificamos
  // principalmente la inyección de dependencias y que el servicio levante correctamente.
});
