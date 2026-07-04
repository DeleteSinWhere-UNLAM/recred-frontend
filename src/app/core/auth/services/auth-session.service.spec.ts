import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import type { AuthSession } from 'aws-amplify/auth';
import { AuthSessionService } from './auth-session.service';

class AuthSessionMother {
  static crearCompleta(): AuthSession {
    return {
      userSub: 'sub-123',
      tokens: {
        accessToken: {
          toString: () => 'access-token',
          payload: { sub: 'sub-123' },
        },
        idToken: {
          toString: () => 'id-token',
          payload: {
            sub: 'sub-123',
            email: 'test@recred.com',
            given_name: 'Martín',
            family_name: 'García',
          },
        },
      },
    } as unknown as AuthSession;
  }

  static crearSinAccessToken(): AuthSession {
    return {
      userSub: 'sub-123',
      tokens: {
        idToken: { toString: () => 'id-token', payload: { sub: 'sub-123' } },
      },
    } as unknown as AuthSession;
  }

  static crearVacia(): AuthSession {
    return {} as AuthSession;
  }
}

interface ServicioInterno {
  obtenerSesionActual: (forceRefresh?: boolean) => Promise<AuthSession | null>;
}

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let obtenerSesionSpy: jasmine.Spy;

  beforeEach(() => {
    localStorage.setItem('CognitoIdentityServiceProvider.mockKey', 'true');
    TestBed.configureTestingModule({
      providers: [AuthSessionService],
    });

    service = TestBed.inject(AuthSessionService);
    obtenerSesionSpy = spyOn(service as unknown as ServicioInterno, 'obtenerSesionActual');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('haySesionAutenticada', () => {
    it('dado una sesion con accessToken e idToken, deberia devolver true', async () => {
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearCompleta());

      expect(await service.haySesionAutenticada()).toBeTrue();
    });

    it('dado una sesion sin accessToken, deberia devolver false', async () => {
      spyOn(console, 'warn');
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearSinAccessToken());

      expect(await service.haySesionAutenticada()).toBeFalse();
    });

    it('dado una sesion null, deberia devolver false', async () => {
      spyOn(console, 'warn');
      obtenerSesionSpy.and.resolveTo(null);

      expect(await service.haySesionAutenticada()).toBeFalse();
    });
  });

  describe('esperarSesionAutenticada', () => {
    it('dado una sesion completa al primer intento, deberia devolverla', async () => {
      const session = AuthSessionMother.crearCompleta();
      obtenerSesionSpy.and.resolveTo(session);

      expect(await service.esperarSesionAutenticada()).toBe(session);
      expect(obtenerSesionSpy).toHaveBeenCalledTimes(1);
    });

    it('dado que la sesion aparece al 3er intento, deberia devolverla despues de reintentar', fakeAsync(async () => {
      spyOn(console, 'warn');
      const session = AuthSessionMother.crearCompleta();
      obtenerSesionSpy.and.returnValues(
        Promise.resolve(AuthSessionMother.crearVacia()),
        Promise.resolve(AuthSessionMother.crearVacia()),
        Promise.resolve(session),
      );

      let resultado: AuthSession | null | undefined;
      service.esperarSesionAutenticada({ reintentos: 5, intervaloMs: 10 }).then((s) => {
        resultado = s;
      });

      await flushMicrotasks();
      tick(10);
      await flushMicrotasks();
      tick(10);
      await flushMicrotasks();

      expect(resultado).toBe(session);
      expect(obtenerSesionSpy).toHaveBeenCalledTimes(3);
    }));

    it('dado que la sesion nunca aparece, deberia devolver null tras agotar los reintentos', fakeAsync(async () => {
      spyOn(console, 'warn');
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearVacia());

      let resultado: AuthSession | null | undefined;
      service.esperarSesionAutenticada({ reintentos: 2, intervaloMs: 5 }).then((s) => {
        resultado = s;
      });

      await flushMicrotasks();
      tick(5);
      await flushMicrotasks();
      tick(5);
      await flushMicrotasks();

      expect(resultado).toBeNull();
      expect(obtenerSesionSpy).toHaveBeenCalledTimes(3);
    }));

    it('dado forceRefresh, deberia pasar el flag a obtenerSesionActual', async () => {
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearCompleta());

      await service.esperarSesionAutenticada({ forceRefresh: true });

      expect(obtenerSesionSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('obtenerAccessTokenParaApi', () => {
    it('dado una sesion completa, deberia devolver el accessToken como string', async () => {
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearCompleta());

      expect(await service.obtenerAccessTokenParaApi()).toBe('access-token');
    });

    it('dado que no hay sesion, deberia devolver null', async () => {
      spyOn(console, 'warn');
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearVacia());

      expect(await service.obtenerAccessTokenParaApi({ reintentos: 0 })).toBeNull();
    });
  });

  describe('obtenerIdToken', () => {
    it('dado una sesion completa, deberia devolver el idToken como string', async () => {
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearCompleta());

      expect(await service.obtenerIdToken()).toBe('id-token');
    });

    it('dado que no hay sesion, deberia devolver null', async () => {
      spyOn(console, 'warn');
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearVacia());

      expect(await service.obtenerIdToken({ reintentos: 0 })).toBeNull();
    });
  });

  describe('obtenerSub', () => {
    it('dado una sesion con userSub, deberia devolverlo', async () => {
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearCompleta());

      expect(await service.obtenerSub()).toBe('sub-123');
    });

    it('dado una sesion sin userSub pero con sub en idToken, deberia devolver el del idToken', async () => {
      const session = {
        tokens: { idToken: { payload: { sub: 'sub-del-token' } } },
      } as unknown as AuthSession;
      obtenerSesionSpy.and.resolveTo(session);

      expect(await service.obtenerSub()).toBe('sub-del-token');
    });

    it('dado una sesion vacia, deberia devolver undefined', async () => {
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearVacia());

      expect(await service.obtenerSub()).toBeUndefined();
    });
  });

  describe('obtenerAtributosUsuario', () => {
    it('dado una sesion con given_name y family_name, deberia devolver los atributos mapeados', async () => {
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearCompleta());

      const attrs = await service.obtenerAtributosUsuario();

      expect(attrs.sub).toBe('sub-123');
      expect(attrs.email).toBe('test@recred.com');
      expect(attrs.nombre).toBe('Martín');
      expect(attrs.apellido).toBe('García');
    });

    it('dado given_name ausente, deberia usar name como fallback', async () => {
      const session = {
        userSub: 'sub-1',
        tokens: {
          accessToken: { toString: () => 'a', payload: {} },
          idToken: {
            toString: () => 'i',
            payload: { sub: 'sub-1', email: 'x@y.com', name: 'Nombre Completo' },
          },
        },
      } as unknown as AuthSession;
      obtenerSesionSpy.and.resolveTo(session);

      const attrs = await service.obtenerAtributosUsuario();

      expect(attrs.nombre).toBe('Nombre Completo');
    });

    it('dado sesion sin payload, deberia devolver objeto vacio', async () => {
      spyOn(console, 'warn');
      obtenerSesionSpy.and.resolveTo(AuthSessionMother.crearVacia());

      expect(await service.obtenerAtributosUsuario()).toEqual({});
    });

    it('dado atributos vacios en el payload, deberia devolverlos como undefined', async () => {
      const session = {
        userSub: 'sub-1',
        tokens: {
          accessToken: { toString: () => 'a', payload: {} },
          idToken: { toString: () => 'i', payload: { sub: '', email: '  ' } },
        },
      } as unknown as AuthSession;
      obtenerSesionSpy.and.resolveTo(session);

      const attrs = await service.obtenerAtributosUsuario();

      expect(attrs.sub).toBeUndefined();
      expect(attrs.email).toBeUndefined();
    });
  });

  function flushMicrotasks(): Promise<void> {
    return new Promise((resolve) => resolve());
  }
});
