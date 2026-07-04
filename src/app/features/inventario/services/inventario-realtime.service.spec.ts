import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { environment } from '../../../../environments/environment';
import { EventoInventarioRealtime } from '../models/inventario.interface';
import { InventarioRealtimeService } from './inventario-realtime.service';

interface ServicioInterno {
  parsePayload: (data: string) => EventoInventarioRealtime | null;
  normalizeEventType: (type: string | undefined) => string | null;
  notifyRefresh: (event: EventoInventarioRealtime) => void;
  notifyPurchaseCreated: (event: EventoInventarioRealtime) => void;
  notifyOpen: () => void;
  notifyClose: () => void;
  notifyError: (error: unknown) => void;
  recordSseEvent: (eventType: string) => void;
  logMetrics: (label: string, metricMap: Map<string, number>) => void;
  scheduleIdleDisconnect: () => void;
  status: 'disconnected' | 'connecting' | 'connected';
  sharedAbortController: AbortController | null;
  subscribers: Map<number, unknown>;
}

class EventoInventarioMother {
  static crearRefresh(override: Partial<EventoInventarioRealtime> = {}): EventoInventarioRealtime {
    return {
      buffetId: 'buffet-1',
      type: 'STOCK_CHANGED',
      productId: 'prod-1',
      occurredAt: '2026-07-01T10:00:00Z',
      ...override,
    };
  }

  static crearPurchase(): EventoInventarioRealtime {
    return {
      buffetId: 'buffet-1',
      type: 'PURCHASE_CREATED',
      purchaseId: 'purchase-1',
      occurredAt: '2026-07-01T10:00:00Z',
    };
  }
}

describe('InventarioRealtimeService', () => {
  let service: InventarioRealtimeService;
  let interno: ServicioInterno;
  let servicioAuth: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    servicioAuth = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'obtenerAccessTokenParaApi',
    ]);
    servicioAuth.obtenerAccessTokenParaApi.and.returnValue(new Promise(() => undefined));

    TestBed.configureTestingModule({
      providers: [
        InventarioRealtimeService,
        { provide: AuthSessionService, useValue: servicioAuth },
      ],
    });

    service = TestBed.inject(InventarioRealtimeService);
    interno = service as unknown as ServicioInterno;
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('connect', () => {
    it('dado un handler para un buffet, cuando llamo connect, deberia devolver un AbortController', () => {
      const controller = service.connect('buffet-1', { onRefresh: jasmine.createSpy() });

      expect(controller).toBeInstanceOf(AbortController);
    });

    it('dado el primer subscriber, cuando llamo connect, deberia pedir el token de la sesion', () => {
      service.connect('buffet-1', { onRefresh: jasmine.createSpy() });

      expect(servicioAuth.obtenerAccessTokenParaApi).toHaveBeenCalled();
    });

    it('dado varios subscribers al mismo buffet, cuando conecto de nuevo, no deberia pedir un token nuevo', () => {
      service.connect('buffet-1', { onRefresh: jasmine.createSpy() });
      service.connect('buffet-1', { onRefresh: jasmine.createSpy() });

      expect(servicioAuth.obtenerAccessTokenParaApi).toHaveBeenCalledTimes(1);
    });

    it('dado un subscriber activo, cuando aborto su controller, deberia sacarlo de la lista', () => {
      const onRefresh = jasmine.createSpy();
      const controller = service.connect('buffet-1', { onRefresh });

      controller.abort();

      const evento = EventoInventarioMother.crearRefresh();
      interno.notifyRefresh(evento);

      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('notificaciones a los subscribers', () => {
    let onRefresh: jasmine.Spy;
    let onPurchaseCreated: jasmine.Spy;
    let onOpen: jasmine.Spy;
    let onClose: jasmine.Spy;
    let onError: jasmine.Spy;

    beforeEach(() => {
      onRefresh = jasmine.createSpy('onRefresh');
      onPurchaseCreated = jasmine.createSpy('onPurchaseCreated');
      onOpen = jasmine.createSpy('onOpen');
      onClose = jasmine.createSpy('onClose');
      onError = jasmine.createSpy('onError');

      service.connect('buffet-1', {
        onRefresh,
        onPurchaseCreated,
        onOpen,
        onClose,
        onError,
      });
    });

    it('dado un notifyRefresh interno, deberia llamar onRefresh de cada subscriber', () => {
      const evento = EventoInventarioMother.crearRefresh();

      interno.notifyRefresh(evento);

      expect(onRefresh).toHaveBeenCalledWith(evento);
    });

    it('dado un notifyPurchaseCreated interno, deberia llamar onPurchaseCreated', () => {
      const evento = EventoInventarioMother.crearPurchase();

      interno.notifyPurchaseCreated(evento);

      expect(onPurchaseCreated).toHaveBeenCalledWith(evento);
    });

    it('dado un notifyOpen interno, deberia llamar onOpen', () => {
      interno.notifyOpen();

      expect(onOpen).toHaveBeenCalled();
    });

    it('dado un notifyClose interno, deberia llamar onClose', () => {
      interno.notifyClose();

      expect(onClose).toHaveBeenCalled();
    });

    it('dado un notifyError interno, deberia llamar onError con el error', () => {
      const error = new Error('boom');

      interno.notifyError(error);

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('normalizeEventType', () => {
    it('dado un tipo con espacios y guiones, deberia devolverlo en UPPER_SNAKE', () => {
      expect(interno.normalizeEventType('stock changed')).toBe('STOCK_CHANGED');
      expect(interno.normalizeEventType('low-stock')).toBe('LOW_STOCK');
      expect(interno.normalizeEventType('  order_updated  ')).toBe('ORDER_UPDATED');
    });

    it('dado un tipo vacio o undefined, deberia devolver null', () => {
      expect(interno.normalizeEventType('')).toBeNull();
      expect(interno.normalizeEventType(undefined)).toBeNull();
      expect(interno.normalizeEventType('   ')).toBeNull();
    });
  });

  describe('parsePayload', () => {
    it('dado un JSON valido, deberia devolver el objeto parseado', () => {
      const raw = JSON.stringify(EventoInventarioMother.crearRefresh());

      const parsed = interno.parsePayload(raw);

      expect(parsed?.type).toBe('STOCK_CHANGED');
    });

    it('dado un JSON invalido, deberia loguear warn y devolver null', () => {
      spyOn(console, 'warn');

      const parsed = interno.parsePayload('no-es-json');

      expect(parsed).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('cambio de buffet', () => {
    it('dado subscribers en buffet-1, cuando conecto a buffet-2, deberia notificar close a los del buffet-1', () => {
      const onClose = jasmine.createSpy();
      service.connect('buffet-1', { onRefresh: jasmine.createSpy(), onClose });

      service.connect('buffet-2', { onRefresh: jasmine.createSpy() });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('dado subscribers activos, cuando llamo disconnect, deberia limpiar la lista de subscribers', () => {
      const onRefresh = jasmine.createSpy();
      service.connect('buffet-1', { onRefresh });

      service.disconnect();

      interno.notifyRefresh(EventoInventarioMother.crearRefresh());
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('recordRefetch', () => {
    it('deberia poder llamarse sin romper', () => {
      expect(() => service.recordRefetch('inventario')).not.toThrow();
    });
  });

  describe('metricas por ventana', () => {
    it('dado un recordSseEvent, cuando pasan 60s, deberia loguear el resumen y limpiar el contador', fakeAsync(() => {
      const infoSpy = spyOn(console, 'info');
      interno.recordSseEvent('STOCK_CHANGED');
      interno.recordSseEvent('STOCK_CHANGED');
      interno.recordSseEvent('LOW_STOCK');

      tick(60000);

      expect(infoSpy).toHaveBeenCalledWith(
        '[Realtime] Eventos SSE por minuto',
        jasmine.objectContaining({ STOCK_CHANGED: 2, LOW_STOCK: 1 }),
      );
    }));

    it('dado varios recordSseEvent seguidos, deberia programar el timeout una sola vez', fakeAsync(() => {
      const infoSpy = spyOn(console, 'info');
      interno.recordSseEvent('STOCK_CHANGED');
      interno.recordSseEvent('STOCK_CHANGED');

      tick(60000);

      expect(infoSpy).toHaveBeenCalledTimes(1);
    }));

    it('dado un recordRefetch, cuando pasan 60s, deberia loguear el resumen de refetch', fakeAsync(() => {
      const infoSpy = spyOn(console, 'info');
      service.recordRefetch('inventario-panel');
      service.recordRefetch('inventario-panel');

      tick(60000);

      expect(infoSpy).toHaveBeenCalledWith(
        '[Realtime] Refetch realtime por minuto',
        jasmine.objectContaining({ 'inventario-panel': 2 }),
      );
    }));

    it('dado logMetrics con un map vacio, no deberia loguear nada', () => {
      const infoSpy = spyOn(console, 'info');

      interno.logMetrics('label', new Map());

      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('dado environment.production true, recordSseEvent deberia no acumular ni programar timeout', fakeAsync(() => {
      const infoSpy = spyOn(console, 'info');
      const original = environment.production;
      environment.production = true;

      try {
        interno.recordSseEvent('STOCK_CHANGED');
        tick(60000);
        expect(infoSpy).not.toHaveBeenCalled();
      } finally {
        environment.production = original;
      }
    }));
  });

  describe('idle disconnect', () => {
    it('dado subscribers activos, cuando aborto el ultimo, deberia cerrar la conexion compartida despues del timeout', fakeAsync(() => {
      const controller = service.connect('buffet-1', { onRefresh: jasmine.createSpy() });
      interno.sharedAbortController = new AbortController();
      const abortSpy = spyOn(interno.sharedAbortController, 'abort').and.callThrough();

      controller.abort();
      tick(30000);

      expect(abortSpy).toHaveBeenCalled();
      expect(interno.sharedAbortController).toBeNull();
    }));

    it('dado el timeout de idle, si vuelve a haber subscribers, no deberia cerrar la conexion', fakeAsync(() => {
      const controller = service.connect('buffet-1', { onRefresh: jasmine.createSpy() });
      interno.sharedAbortController = new AbortController();
      const abortSpy = spyOn(interno.sharedAbortController, 'abort').and.callThrough();

      controller.abort();
      service.connect('buffet-1', { onRefresh: jasmine.createSpy() });
      tick(30000);

      expect(abortSpy).not.toHaveBeenCalled();
    }));
  });

  describe('connect cuando la conexion ya esta abierta', () => {
    it('dado status "connected", cuando llega un nuevo subscriber, deberia dispararle onOpen inmediatamente', () => {
      interno.status = 'connected';
      const onOpen = jasmine.createSpy('onOpen');

      service.connect('buffet-1', { onRefresh: jasmine.createSpy(), onOpen });

      expect(onOpen).toHaveBeenCalled();
    });
  });

  describe('startConnection sin token', () => {
    it('dado que el auth no devuelve token, deberia notificar error y quedar desconectado', fakeAsync(() => {
      servicioAuth.obtenerAccessTokenParaApi.and.resolveTo(null);
      const onError = jasmine.createSpy('onError');
      service.connect('buffet-1', { onRefresh: jasmine.createSpy(), onError });

      flush();

      expect(onError).toHaveBeenCalledWith(jasmine.any(Error));
      expect(interno.sharedAbortController).toBeNull();
      expect(interno.status).toBe('disconnected');
    }));

    it('dado que se aborta antes de obtener el token, no deberia notificar error', fakeAsync(() => {
      let resolveToken!: (value: string | null) => void;
      servicioAuth.obtenerAccessTokenParaApi.and.returnValue(
        new Promise((res) => {
          resolveToken = res;
        }),
      );
      const onError = jasmine.createSpy('onError');
      const controller = service.connect('buffet-1', { onRefresh: jasmine.createSpy(), onError });

      controller.abort();
      service.disconnect();
      resolveToken('un-token');
      flush();

      expect(onError).not.toHaveBeenCalled();
    }));
  });
});
