import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Notificacion, NotificacionBackend, NotificacionesService } from './notificaciones.service';

describe('NotificacionesService', () => {
  const URL_NOTIFICACIONES = `${environment.apiUrl}/notifications/me?size=50`;

  let service: NotificacionesService;
  let httpMock: HttpTestingController;

  class NotificacionMother {
    static crear(override: Partial<Notificacion> = {}): Notificacion {
      return { id: '1', titulo: 'Titulo', read: false, ...override };
    }
  }

  class NotificacionBackendMother {
    static ingles(override: Partial<NotificacionBackend> = {}): NotificacionBackend {
      return {
        id: 'n1',
        title: 'Titulo en ingles',
        message: 'Mensaje en ingles',
        createdAt: '2026-07-01',
        type: 'PROMO',
        ...override,
      };
    }

    static espanol(override: Partial<NotificacionBackend> = {}): NotificacionBackend {
      return {
        id: 'n2',
        titulo: 'Hola',
        mensaje: 'Mensaje',
        fecha: '2026-07-02',
        tipo: 'INFO',
        ...override,
      };
    }
  }

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
      thenLaCantidadEs(0);
    });

    it('dado que hay notificaciones no leidas, cuando la calculo, deberia contar solo las no leidas', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: '1', read: false }));
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: '2', read: true }));

      thenLaCantidadEs(1);
    });

    it('dado que hay notificaciones cargadas todas leidas, cuando la calculo, deberia devolver 0', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: '1', read: true }));

      thenLaCantidadEs(0);
    });
  });

  describe('agregarNotificacion', () => {
    it('dado dos notificaciones agregadas, cuando leo la lista, la ultima deberia estar al inicio', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: '1', titulo: 'Vieja' }));
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: '2', titulo: 'Nueva' }));

      thenLosIdsDeLaListaSon(['2', '1']);
    });
  });

  describe('obtenerNotificaciones', () => {
    it('dado que el back devuelve notificaciones en formato ingles, cuando las pido, deberia mapearlas al modelo interno', () => {
      spyOn(console, 'log');
      const backend = [NotificacionBackendMother.ingles()];

      whenPidoLasNotificaciones();
      whenElBackDevuelve(backend);

      const [notif] = service.notificaciones();
      expect(notif.titulo).toBe('Titulo en ingles');
      expect(notif.mensaje).toBe('Mensaje en ingles');
      expect(notif.fecha).toBe('2026-07-01');
      expect(notif.tipo).toBe('PROMO');
    });

    it('dado que el back devuelve en formato espanol, cuando las pido, deberia preservar los campos', () => {
      spyOn(console, 'log');
      const backend = [NotificacionBackendMother.espanol()];

      whenPidoLasNotificaciones();
      whenElBackDevuelve(backend);

      expect(service.notificaciones()[0].titulo).toBe('Hola');
    });

    it('dado un item sin titulo/message, cuando las pido, deberia usar defaults', () => {
      spyOn(console, 'log');

      whenPidoLasNotificaciones();
      whenElBackDevuelve([{ id: 'n3' }]);

      expect(service.notificaciones()[0].titulo).toBe('Notificación');
      expect(service.notificaciones()[0].mensaje).toBe('');
    });

    it('dado que el back devuelve null, cuando las pido, deberia dejar la lista vacia', () => {
      spyOn(console, 'log');

      whenPidoLasNotificaciones();
      whenElBackDevuelve(null);

      expect(service.notificaciones()).toEqual([]);
    });

    it('dado que el back falla, cuando las pido, deberia loguear el error y no romper', () => {
      spyOn(console, 'error');

      whenPidoLasNotificaciones();
      whenElBackFallaCon500();

      expect(console.error).toHaveBeenCalled();
    });
  });

  function givenNotificacionEnLaLista(notificacion: Notificacion): void {
    service.agregarNotificacion(notificacion);
  }

  function whenPidoLasNotificaciones(): void {
    service.obtenerNotificaciones();
  }

  function whenElBackDevuelve(body: NotificacionBackend[] | null): void {
    httpMock.expectOne(URL_NOTIFICACIONES).flush(body);
  }

  function whenElBackFallaCon500(): void {
    httpMock
      .expectOne(URL_NOTIFICACIONES)
      .flush('boom', { status: 500, statusText: 'Server Error' });
  }

  function thenLaCantidadEs(cantidad: number): void {
    expect(service.cantidad()).toBe(cantidad);
  }

  function thenLosIdsDeLaListaSon(ids: string[]): void {
    expect(service.notificaciones().map((n) => n.id)).toEqual(ids);
  }
});
