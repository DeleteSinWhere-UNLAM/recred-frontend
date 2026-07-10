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

  static crearConIdTokenPayload(payload: Record<string, unknown>): AuthSession {
    return {
      userSub: 'sub-1',
      tokens: {
        accessToken: { toString: () => 'a', payload: {} },
        idToken: { toString: () => 'i', payload },
      },
    } as unknown as AuthSession;
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
    it('dado una sesion con accessToken e idToken, cuando la consulto, deberia devolver true', async () => {
      givenSesion(AuthSessionMother.crearCompleta());

      expect(await service.haySesionAutenticada()).toBeTrue();
    });

    it('dado una sesion sin accessToken, cuando la consulto, deberia devolver false', async () => {
      spyOn(console, 'warn');
      givenSesion(AuthSessionMother.crearSinAccessToken());

      expect(await service.haySesionAutenticada()).toBeFalse();
    });

    it('dado una sesion null, cuando la consulto, deberia devolver false', async () => {
      spyOn(console, 'warn');
      givenSesion(null);

      expect(await service.haySesionAutenticada()).toBeFalse();
    });
  });

  describe('esperarSesionAutenticada', () => {
    it('dado una sesion completa al primer intento, cuando espero, deberia devolverla', async () => {
      const session = AuthSessionMother.crearCompleta();
      givenSesion(session);

      expect(await service.esperarSesionAutenticada()).toBe(session);
      expect(obtenerSesionSpy).toHaveBeenCalledTimes(1);
    });

    it('dado que la sesion aparece al 3er intento, cuando espero, deberia devolverla despues de reintentar', fakeAsync(async () => {
      spyOn(console, 'warn');
      const session = AuthSessionMother.crearCompleta();
      givenSecuenciaDeSesiones(
        AuthSessionMother.crearVacia(),
        AuthSessionMother.crearVacia(),
        session,
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

    it('dado que la sesion nunca aparece, cuando espero, deberia devolver null tras agotar los reintentos', fakeAsync(async () => {
      spyOn(console, 'warn');
      givenSesion(AuthSessionMother.crearVacia());

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

    it('dado forceRefresh true, cuando espero, deberia pasar el flag a obtenerSesionActual', async () => {
      givenSesion(AuthSessionMother.crearCompleta());

      await service.esperarSesionAutenticada({ forceRefresh: true });

      expect(obtenerSesionSpy).toHaveBeenCalledWith(true);
    });

    it('dado que no hay datos de sesion en storage, cuando espero, deberia devolver null sin consultar Amplify', async () => {
      localStorage.clear();

      const resultado = await service.esperarSesionAutenticada();

      expect(resultado).toBeNull();
      expect(obtenerSesionSpy).not.toHaveBeenCalled();
    });

    it('dado datos de sesion con prefix amplify- en storage, cuando espero, deberia consultar Amplify', async () => {
      localStorage.clear();
      localStorage.setItem('amplify-signin-with-hostedUI', 'true');
      givenSesion(AuthSessionMother.crearCompleta());

      await service.esperarSesionAutenticada();

      expect(obtenerSesionSpy).toHaveBeenCalled();
    });
  });

  describe('obtenerAccessTokenParaApi', () => {
    it('dado una sesion completa, cuando pido el access token, deberia devolverlo como string', async () => {
      givenSesion(AuthSessionMother.crearCompleta());

      expect(await service.obtenerAccessTokenParaApi()).toBe('access-token');
    });

    it('dado que no hay sesion, cuando pido el access token, deberia devolver null', async () => {
      spyOn(console, 'warn');
      givenSesion(AuthSessionMother.crearVacia());

      expect(await service.obtenerAccessTokenParaApi({ reintentos: 0 })).toBeNull();
    });
  });

  describe('obtenerIdToken', () => {
    it('dado una sesion completa, cuando pido el id token, deberia devolverlo como string', async () => {
      givenSesion(AuthSessionMother.crearCompleta());

      expect(await service.obtenerIdToken()).toBe('id-token');
    });

    it('dado que no hay sesion, cuando pido el id token, deberia devolver null', async () => {
      spyOn(console, 'warn');
      givenSesion(AuthSessionMother.crearVacia());

      expect(await service.obtenerIdToken({ reintentos: 0 })).toBeNull();
    });
  });

  describe('obtenerSub', () => {
    it('dado una sesion con userSub, cuando pido el sub, deberia devolverlo', async () => {
      givenSesion(AuthSessionMother.crearCompleta());

      expect(await service.obtenerSub()).toBe('sub-123');
    });

    it('dado una sesion sin userSub pero con sub en idToken, cuando pido el sub, deberia devolver el del idToken', async () => {
      const session = {
        tokens: { idToken: { payload: { sub: 'sub-del-token' } } },
      } as unknown as AuthSession;
      givenSesion(session);

      expect(await service.obtenerSub()).toBe('sub-del-token');
    });

    it('dado una sesion vacia, cuando pido el sub, deberia devolver undefined', async () => {
      givenSesion(AuthSessionMother.crearVacia());

      expect(await service.obtenerSub()).toBeUndefined();
    });
  });

  describe('obtenerAtributosUsuario', () => {
    it('dado una sesion con given_name y family_name, cuando pido los atributos, deberia devolverlos mapeados', async () => {
      givenSesion(AuthSessionMother.crearCompleta());

      const attrs = await service.obtenerAtributosUsuario();

      expect(attrs.sub).toBe('sub-123');
      expect(attrs.email).toBe('test@recred.com');
      expect(attrs.nombre).toBe('Martín');
      expect(attrs.apellido).toBe('García');
    });

    it('dado given_name ausente, cuando pido los atributos, deberia usar name como fallback', async () => {
      givenSesion(AuthSessionMother.crearConIdTokenPayload({
        sub: 'sub-1',
        email: 'x@y.com',
        name: 'Nombre Completo',
      }));

      const attrs = await service.obtenerAtributosUsuario();

      expect(attrs.nombre).toBe('Nombre Completo');
    });

    it('dado sesion sin payload, cuando pido los atributos, deberia devolver objeto vacio', async () => {
      spyOn(console, 'warn');
      givenSesion(AuthSessionMother.crearVacia());

      expect(await service.obtenerAtributosUsuario()).toEqual({});
    });

    it('dado atributos vacios en el payload, cuando pido los atributos, deberia devolverlos como undefined', async () => {
      givenSesion(AuthSessionMother.crearConIdTokenPayload({ sub: '', email: '  ' }));

      const attrs = await service.obtenerAtributosUsuario();

      expect(attrs.sub).toBeUndefined();
      expect(attrs.email).toBeUndefined();
    });
  });

  function givenSesion(session: AuthSession | null): void {
    obtenerSesionSpy.and.resolveTo(session);
  }

  function givenSecuenciaDeSesiones(...sesiones: (AuthSession | null)[]): void {
    obtenerSesionSpy.and.returnValues(...sesiones.map((s) => Promise.resolve(s)));
  }

  function flushMicrotasks(): Promise<void> {
    return new Promise((resolve) => resolve());
  }
});
