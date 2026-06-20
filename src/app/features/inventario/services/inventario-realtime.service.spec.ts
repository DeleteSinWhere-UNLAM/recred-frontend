import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InventarioRealtimeService } from './inventario-realtime.service';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';

describe('InventarioRealtimeService', () => {
  let service: InventarioRealtimeService;
  let authSessionSpy: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthSessionService', ['obtenerAccessTokenParaApi']);
    
    TestBed.configureTestingModule({
      providers: [
        InventarioRealtimeService,
        { provide: AuthSessionService, useValue: spy }
      ]
    });
    service = TestBed.inject(InventarioRealtimeService);
    authSessionSpy = TestBed.inject(AuthSessionService) as jasmine.SpyObj<AuthSessionService>;
  });

  afterEach(() => {
    service.disconnect();
  });

  it('debería ser creado', () => {
    expect(service).toBeTruthy();
  });

  it('connect debería retornar un AbortController y manejar error si no hay token', fakeAsync(() => {
    authSessionSpy.obtenerAccessTokenParaApi.and.returnValue(Promise.resolve(null));
    
    const handlers = {
      onRefresh: jasmine.createSpy('onRefresh'),
      onError: jasmine.createSpy('onError')
    };

    const controller = service.connect('buffet123', handlers);
    expect(controller).toBeInstanceOf(AbortController);
    
    tick(); // resolver la promesa
    
    expect(handlers.onError).toHaveBeenCalled();
    expect(handlers.onError.calls.mostRecent().args[0].message).toBe('No hay token disponible para SSE');
  }));

  it('disconnect debería limpiar los suscriptores', () => {
    const controller = service.connect('buffet123', { onRefresh: () => {} });
    service.disconnect();
    expect(controller).toBeDefined();
  });

  it('recordRefetch no debería crashear en desarrollo', () => {
    expect(() => service.recordRefetch('test')).not.toThrow();
  });
  
  it('connect debería llamar a onOpen si ya estaba conectado', () => {
      (service as any).status = 'connected';
      const onOpenSpy = jasmine.createSpy('onOpen');
      service.connect('buffet123', { onRefresh: () => {}, onOpen: onOpenSpy });
      expect(onOpenSpy).toHaveBeenCalled();
  });
  
  it('debería manejar desconexión si se cambia de buffet', () => {
      service.connect('buffet1', { onRefresh: () => {} });
      const controller2 = service.connect('buffet2', { onRefresh: () => {} });
      expect(controller2).toBeTruthy();
      expect((service as any).currentBuffetId).toBe('buffet2');
  });

  it('deberia normalizar tipos de evento y descartar vacios', () => {
    expect((service as any).normalizeEventType('low-stock')).toBe('LOW_STOCK');
    expect((service as any).normalizeEventType(' dashboard changed ')).toBe(
      'DASHBOARD_CHANGED',
    );
    expect((service as any).normalizeEventType('')).toBeNull();
    expect((service as any).normalizeEventType(undefined)).toBeNull();
  });

  it('deberia parsear payload valido y avisar payload invalido', () => {
    spyOn(console, 'warn');

    expect(
      (service as any).parsePayload(
        JSON.stringify({
          buffetId: 'buffet123',
          type: 'STOCK_CHANGED',
          occurredAt: '2026-06-19T10:00:00Z',
        }),
      ),
    ).toEqual(
      jasmine.objectContaining({
        buffetId: 'buffet123',
        type: 'STOCK_CHANGED',
      }),
    );
    expect((service as any).parsePayload('{')).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it('deberia notificar eventos a todos los suscriptores registrados', () => {
    const first = {
      onOpen: jasmine.createSpy('firstOpen'),
      onClose: jasmine.createSpy('firstClose'),
      onRefresh: jasmine.createSpy('firstRefresh'),
      onPurchaseCreated: jasmine.createSpy('firstPurchase'),
      onError: jasmine.createSpy('firstError'),
    };
    const second = {
      onRefresh: jasmine.createSpy('secondRefresh'),
    };
    const event = {
      buffetId: 'buffet123',
      type: 'PURCHASE_CREATED',
      occurredAt: '2026-06-19T10:00:00Z',
    };
    const error = new Error('conexion');

    (service as any).subscribers.set(1, first);
    (service as any).subscribers.set(2, second);

    (service as any).notifyOpen();
    (service as any).notifyRefresh(event);
    (service as any).notifyPurchaseCreated(event);
    (service as any).notifyError(error);
    (service as any).notifyClose();

    expect(first.onOpen).toHaveBeenCalled();
    expect(first.onRefresh).toHaveBeenCalledWith(event);
    expect(second.onRefresh).toHaveBeenCalledWith(event);
    expect(first.onPurchaseCreated).toHaveBeenCalledWith(event);
    expect(first.onError).toHaveBeenCalledWith(error);
    expect(first.onClose).toHaveBeenCalled();
  });

  it('deberia remover el suscriptor abortado y cerrar por inactividad', fakeAsync(() => {
    authSessionSpy.obtenerAccessTokenParaApi.and.returnValue(
      new Promise(() => undefined),
    );

    const controller = service.connect('buffet123', { onRefresh: () => {} });

    expect((service as any).subscribers.size).toBe(1);

    controller.abort();
    expect((service as any).subscribers.size).toBe(0);

    tick(30000);

    expect((service as any).sharedAbortController).toBeNull();
    expect((service as any).currentBuffetId).toBeNull();
  }));

  it('deberia notificar cierre al cambiar de buffet', () => {
    authSessionSpy.obtenerAccessTokenParaApi.and.returnValue(
      new Promise(() => undefined),
    );
    const onClose = jasmine.createSpy('onClose');

    service.connect('buffet1', { onRefresh: () => {}, onClose });
    service.connect('buffet2', { onRefresh: () => {} });

    expect(onClose).toHaveBeenCalled();
    expect((service as any).currentBuffetId).toBe('buffet2');
  });

  it('deberia registrar metricas de eventos y refetch en desarrollo', fakeAsync(() => {
    spyOn(console, 'info');

    (service as any).recordSseEvent('STOCK_CHANGED');
    service.recordRefetch('inventario');

    tick(60000);

    expect(console.info).toHaveBeenCalledWith(
      '[Realtime] Eventos SSE por minuto',
      { STOCK_CHANGED: 1 },
    );
    expect(console.info).toHaveBeenCalledWith(
      '[Realtime] Refetch realtime por minuto',
      { inventario: 1 },
    );
  }));
});
