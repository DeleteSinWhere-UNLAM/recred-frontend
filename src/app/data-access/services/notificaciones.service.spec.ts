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
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        NotificacionesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NotificacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('ordenamiento de notificaciones', () => {
    it('dado una leida y una no leida, la no leida deberia quedar antes', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'nl', read: false, fecha: '2026-06-01' }));
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'l', read: true, fecha: '2026-06-02' }));

      thenLosIdsDeLaListaSon(['nl', 'l']);
    });

    it('dado dos no leidas con fechas distintas, la mas nueva deberia quedar primera', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'vieja', read: false, fecha: '2026-06-01' }));
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'nueva', read: false, fecha: '2026-06-15' }));

      thenLosIdsDeLaListaSon(['nueva', 'vieja']);
    });

    it('dado dos notificaciones sin fecha, el orden deberia ser estable (fallback 0)', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'a', read: false, fecha: undefined }));
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'b', read: false, fecha: undefined }));

      const ids = service.notificaciones().map((n) => n.id);
      expect(ids).toContain('a');
      expect(ids).toContain('b');
    });
  });

  describe('cargarDesdeLocalStorage', () => {
    it('dado que no hay nada en localStorage, cuando se instancia, la lista deberia estar vacia', () => {
      localStorage.removeItem('notificaciones_locales_v1');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          NotificacionesService,
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });
      const fresh = TestBed.inject(NotificacionesService);

      expect(fresh.notificaciones()).toEqual([]);
    });
  });

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

    it('dado una notificacion sin la propiedad read, cuando la agrego, deberia quedar como no leida', () => {
      service.agregarNotificacion({ id: 'sin-read', titulo: 'Nueva' });

      const [nueva] = service.notificaciones();
      expect(nueva.read).toBeFalse();
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

    it('dado un producto con JSON valido en string, cuando pido las notificaciones, deberia parsearlo', () => {
      spyOn(console, 'log');
      const backend = [NotificacionBackendMother.espanol({ producto: '{"nombre":"choco"}' })];

      whenPidoLasNotificaciones();
      whenElBackDevuelve(backend);

      const notif = service.notificaciones()[0] as { producto: unknown };
      expect(notif.producto).toEqual({ nombre: 'choco' });
    });

    it('dado un producto con JSON malformado, cuando pido las notificaciones, deberia ignorar el error y dejar el string', () => {
      spyOn(console, 'log');
      const backend = [NotificacionBackendMother.espanol({ producto: 'no-json' })];

      whenPidoLasNotificaciones();
      whenElBackDevuelve(backend);

      const notif = service.notificaciones()[0] as { producto: unknown };
      expect(notif.producto).toBe('no-json');
    });

    it('dado que la respuesta viene envuelta en { notifications }, cuando las pido, deberia leer del wrapper', () => {
      spyOn(console, 'log');
      const wrapper = { notifications: [NotificacionBackendMother.espanol({ id: 'wrap-1' })] };

      whenPidoLasNotificaciones();
      httpMock.expectOne(URL_NOTIFICACIONES).flush(wrapper);

      expect(service.notificaciones()[0].id).toBe('wrap-1');
    });
  });

  describe('marcarComoLeida', () => {
    it('dado un id vacio, cuando marco como leida, no deberia hacer ninguna request', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n1' }));

      service.marcarComoLeida('');

      expect(service.notificaciones().length).toBe(1);
    });

    it('dado un id valido, cuando marco como leida, deberia hacer PUT y eliminar la notificacion local', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n1' }));

      service.marcarComoLeida('n1');

      const req = httpMock.expectOne(`${environment.apiUrl}/notifications/n1/already-read`);
      expect(req.request.method).toBe('PUT');
      req.flush(null);
      expect(service.notificaciones().find((n) => n.id === 'n1')).toBeUndefined();
    });

    it('dado que el PUT falla, cuando marco como leida, deberia loguear el error y eliminar la notificacion igual', () => {
      spyOn(console, 'error');
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n1' }));

      service.marcarComoLeida('n1');
      httpMock
        .expectOne(`${environment.apiUrl}/notifications/n1/already-read`)
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(console.error).toHaveBeenCalled();
      expect(service.notificaciones().find((n) => n.id === 'n1')).toBeUndefined();
    });
  });

  describe('eliminarNotificacionLocal', () => {
    it('dado un id vacio, cuando elimino local, no deberia tocar la lista', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n1' }));

      service.eliminarNotificacionLocal('');

      expect(service.notificaciones().length).toBe(1);
    });

    it('dado una notificacion cuya sugerenciaId coincide, cuando elimino local por esa sugerenciaId, deberia removerla', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n1', sugerenciaId: 'sug-9' }));

      service.eliminarNotificacionLocal('sug-9');

      expect(service.notificaciones().find((n) => n.sugerenciaId === 'sug-9')).toBeUndefined();
    });
  });

  describe('marcarTodasComoLeidas', () => {
    it('dado que no hay notificaciones no leidas, cuando marco todas como leidas, no deberia hacer requests', () => {
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n1', read: true }));

      service.marcarTodasComoLeidas();

      httpMock.expectNone(`${environment.apiUrl}/notifications/n1/already-read`);
      expect(service.notificaciones().length).toBe(1);
    });

    it('dado dos notificaciones no leidas, cuando marco todas como leidas, deberia limpiar la lista y hacer un PUT por cada una', () => {
      spyOn(console, 'log');
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n1', read: false }));
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n2', read: false }));

      service.marcarTodasComoLeidas();

      httpMock.expectOne(`${environment.apiUrl}/notifications/n1/already-read`).flush(null);
      httpMock.expectOne(`${environment.apiUrl}/notifications/n2/already-read`).flush(null);
      expect(service.notificaciones()).toEqual([]);
    });

    it('dado dos notificaciones no leidas y un PUT que falla, cuando marco todas como leidas, deberia loguear el error', () => {
      spyOn(console, 'log');
      spyOn(console, 'error');
      givenNotificacionEnLaLista(NotificacionMother.crear({ id: 'n1', read: false }));

      service.marcarTodasComoLeidas();

      httpMock
        .expectOne(`${environment.apiUrl}/notifications/n1/already-read`)
        .flush('boom', { status: 500, statusText: 'Server Error' });
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
