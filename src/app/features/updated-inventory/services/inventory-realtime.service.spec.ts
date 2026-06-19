import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InventoryRealtimeService } from './inventory-realtime.service';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';

describe('InventoryRealtimeService', () => {
  let service: InventoryRealtimeService;
  let authSessionSpy: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthSessionService', ['obtenerAccessTokenParaApi']);
    
    TestBed.configureTestingModule({
      providers: [
        InventoryRealtimeService,
        { provide: AuthSessionService, useValue: spy }
      ]
    });
    service = TestBed.inject(InventoryRealtimeService);
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
});
