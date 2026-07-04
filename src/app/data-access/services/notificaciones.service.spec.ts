import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { NotificacionBackend, NotificacionesService } from './notificaciones.service';

describe('NotificacionesService', () => {
  const URL = `${environment.apiUrl}/notifications/me?size=5`;

  let service: NotificacionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificacionesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('cantidad', () => {
    it('dado sin notificaciones, cantidad deberia ser 0', () => {
      expect(service.cantidad()).toBe(0);
    });

    it('dado que seteo cantidad manualmente, deberia reflejarla cuando la lista esta vacia', () => {
      service.setCantidad(4);

      expect(service.cantidad()).toBe(4);
    });

    it('dado cantidad negativa, deberia clampearla a 0', () => {
      service.setCantidad(-5);

      expect(service.cantidad()).toBe(0);
    });

    it('dado que hay notificaciones cargadas, cantidad deberia usar el length de la lista', () => {
      service.agregarNotificacion({ id: '1', titulo: 'x' });

      expect(service.cantidad()).toBe(1);
    });
  });

  describe('agregarNotificacion', () => {
    it('dado una notificacion, deberia agregarla al inicio de la lista', () => {
      service.agregarNotificacion({ id: '1', titulo: 'Vieja' });
      service.agregarNotificacion({ id: '2', titulo: 'Nueva' });

      expect(service.notificaciones().map((n) => n.id)).toEqual(['2', '1']);
    });
  });

  describe('obtenerNotificaciones', () => {
    it('dado que el back devuelve notificaciones en formato ingles, deberia mapearlas al modelo interno', () => {
      const backend: NotificacionBackend[] = [
        {
          id: 'n1',
          title: 'Titulo en ingles',
          message: 'Mensaje en ingles',
          createdAt: '2026-07-01',
          type: 'PROMO',
        },
      ];
      spyOn(console, 'log');

      service.obtenerNotificaciones();
      httpMock.expectOne(URL).flush(backend);

      const [notif] = service.notificaciones();
      expect(notif.titulo).toBe('Titulo en ingles');
      expect(notif.mensaje).toBe('Mensaje en ingles');
      expect(notif.fecha).toBe('2026-07-01');
      expect(notif.tipo).toBe('PROMO');
    });

    it('dado que el back devuelve en formato espanol, deberia preservar los campos', () => {
      const backend: NotificacionBackend[] = [
        { id: 'n2', titulo: 'Hola', mensaje: 'Mensaje', fecha: '2026-07-02', tipo: 'INFO' },
      ];
      spyOn(console, 'log');

      service.obtenerNotificaciones();
      httpMock.expectOne(URL).flush(backend);

      expect(service.notificaciones()[0].titulo).toBe('Hola');
    });

    it('dado un item sin titulo/message, deberia usar defaults', () => {
      spyOn(console, 'log');
      service.obtenerNotificaciones();
      httpMock.expectOne(URL).flush([{ id: 'n3' }]);

      expect(service.notificaciones()[0].titulo).toBe('Notificación');
      expect(service.notificaciones()[0].mensaje).toBe('');
    });

    it('dado que el back devuelve null, deberia dejar la lista vacia', () => {
      spyOn(console, 'log');

      service.obtenerNotificaciones();
      httpMock.expectOne(URL).flush(null);

      expect(service.notificaciones()).toEqual([]);
    });

    it('dado que el back falla, deberia loguear el error y no romper', () => {
      spyOn(console, 'error');

      service.obtenerNotificaciones();
      httpMock.expectOne(URL).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(console.error).toHaveBeenCalled();
    });
  });
});
