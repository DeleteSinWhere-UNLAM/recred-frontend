import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificacionesService, NotificacionBackend } from './notificaciones.service';
import { environment } from '../../../environments/environment';

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificacionesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(NotificacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('setCantidad y cantidad', () => {
    it('dado que se establece una cantidad positiva, la señal cantidad debería reflejarla si no hay notificaciones', () => {
      service.setCantidad(5);
      expect(service.cantidad()).toBe(5);
    });

    it('dado que se establece una cantidad negativa, debería guardarse como 0', () => {
      service.setCantidad(-3);
      expect(service.cantidad()).toBe(0);
    });
  });

  describe('agregarNotificacion', () => {
    it('dado que se agrega una notificación, esta debería aparecer al principio de la lista y actualizar la cantidad', () => {
      service.agregarNotificacion({ id: '1', titulo: 'Test' });
      expect(service.notificaciones().length).toBe(1);
      expect(service.notificaciones()[0].id).toBe('1');
      expect(service.cantidad()).toBe(1);
      
      service.agregarNotificacion({ id: '2', titulo: 'Test 2' });
      expect(service.notificaciones().length).toBe(2);
      expect(service.notificaciones()[0].id).toBe('2');
      expect(service.cantidad()).toBe(2);
    });
  });

  describe('obtenerNotificaciones', () => {
    it('dado que se obtienen notificaciones del backend, debería mapearlas y actualizar el estado', () => {
      const mockBackendData: NotificacionBackend[] = [
        { id: '1', title: 'Título 1', message: 'Mensaje 1', createdAt: '2026-01-01', type: 'INFO' },
        { id: '2', titulo: 'Título 2', mensaje: 'Mensaje 2', fecha: '2026-01-02', tipo: 'ALERT' }
      ];

      service.obtenerNotificaciones();

      const req = httpMock.expectOne(`${environment.apiUrl}/notifications/me?size=5`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendData);

      const notifs = service.notificaciones();
      expect(notifs.length).toBe(2);
      expect(notifs[0]).toEqual({ id: '1', titulo: 'Título 1', mensaje: 'Mensaje 1', fecha: '2026-01-01', tipo: 'INFO' });
      expect(notifs[1]).toEqual({ id: '2', titulo: 'Título 2', mensaje: 'Mensaje 2', fecha: '2026-01-02', tipo: 'ALERT' });
    });

    it('dado que ocurre un error al obtener notificaciones, no debería romper la aplicación ni actualizar el estado con datos inválidos', () => {
      spyOn(console, 'error');
      service.obtenerNotificaciones();

      const req = httpMock.expectOne(`${environment.apiUrl}/notifications/me?size=5`);
      req.error(new ProgressEvent('Error de red'));

      expect(console.error).toHaveBeenCalled();
      expect(service.notificaciones().length).toBe(0);
    });

    it('dado que el backend devuelve null o undefined, debería manejarlo como un array vacío', () => {
      service.obtenerNotificaciones();

      const req = httpMock.expectOne(`${environment.apiUrl}/notifications/me?size=5`);
      req.flush(null);

      expect(service.notificaciones().length).toBe(0);
    });
  });
});
