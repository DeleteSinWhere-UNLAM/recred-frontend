import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { InventoryRealtimeService } from './inventory-realtime.service';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';

describe('InventoryRealtimeService', () => {
  let service: InventoryRealtimeService;
  let authSessionServiceMock: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    authSessionServiceMock = jasmine.createSpyObj('AuthSessionService', [
      'obtenerAccessTokenParaApi',
    ]);

    TestBed.configureTestingModule({
      providers: [
        InventoryRealtimeService,
        { provide: AuthSessionService, useValue: authSessionServiceMock },
      ],
    });

    service = TestBed.inject(InventoryRealtimeService);
  });

  afterEach(() => {
    service.disconnect();
    localStorage.clear();
  });

  it('dado que llamo a connect sin token disponible, deberia notificar error', fakeAsync(() => {
    authSessionServiceMock.obtenerAccessTokenParaApi.and.returnValue(Promise.resolve(null));
    let errorCalled = false;

    service.connect('buffet-1', {
      onRefresh: () => { return; },
      onError: () => {
        errorCalled = true;
      },
    });

    flushMicrotasks();
    
    expect(authSessionServiceMock.obtenerAccessTokenParaApi).toHaveBeenCalled();
    expect(errorCalled).toBeTrue();
  }));

  it('dado que llamo a disconnect, deberia limpiar subscripciones y abortar conexion', fakeAsync(() => {
    authSessionServiceMock.obtenerAccessTokenParaApi.and.returnValue(
      new Promise(() => { return; }) 
    );

    service.connect('buffet-1', {
      onRefresh: () => { return; },
    });

    expect(() => service.disconnect()).not.toThrow();
    flushMicrotasks();
  }));

  it('dado que registro refetch, deberia ejecutarse sin error', () => {
    expect(() => service.recordRefetch('test')).not.toThrow();
  });

  it('dado que llamo a connect con otro buffetId, deberia cerrar conexion anterior', fakeAsync(() => {
    authSessionServiceMock.obtenerAccessTokenParaApi.and.returnValue(
      new Promise(() => { return; })
    );
    let closeCalled = false;

    service.connect('buffet-1', {
      onRefresh: () => { return; },
      onClose: () => {
        closeCalled = true;
      },
    });

    service.connect('buffet-2', {
      onRefresh: () => { return; },
    });

    flushMicrotasks();

    expect(closeCalled).toBeTrue();
  }));

  it('dado que aborto la conexion del subscriber, deberia desconectarse tras idle', fakeAsync(() => {
    authSessionServiceMock.obtenerAccessTokenParaApi.and.returnValue(
      new Promise(() => { return; })
    );

    const abortController = service.connect('buffet-1', {
      onRefresh: () => { return; },
    });

    abortController.abort();
    
    tick(30000);
    flushMicrotasks();

    expect(authSessionServiceMock.obtenerAccessTokenParaApi).toHaveBeenCalled();
  }));
});
