import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthSessionService } from './auth-session.service';
import type { AuthSession } from 'aws-amplify/auth';

describe('AuthSessionService', () => {
  let service: AuthSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthSessionService]
    });
    service = TestBed.inject(AuthSessionService);
    spyOn(console, 'error');
    spyOn(console, 'warn');
  });

  const mockSessionWithTokens = {
    tokens: {
      accessToken: 'access-123' as unknown as import('aws-amplify/auth').JWT,
      idToken: {
        payload: {
          sub: 'sub-123',
          email: 'test@test.com',
          given_name: 'Juan',
          family_name: 'Perez',
        }
      } as unknown as import('aws-amplify/auth').JWT
    },
    userSub: 'sub-123'
  } as unknown as import('aws-amplify/auth').AuthSession;

  const mockSessionWithoutTokens = {
    tokens: undefined
  } as unknown as import('aws-amplify/auth').AuthSession;

  it('dado que se crea el servicio, debe estar definido', () => {
    expect(service).toBeTruthy();
  });

  describe('haySesionAutenticada', () => {
    it('dado que fetchAuthSession retorna sesion valida, debe retornar true', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionWithTokens));

      const result = await service.haySesionAutenticada();

      expect(result).toBeTrue();
      expect(service.amplify.fetchAuthSession).toHaveBeenCalledWith(undefined);
    });

    it('dado que fetchAuthSession retorna sesion sin tokens, debe retornar false y lanzar warn', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionWithoutTokens));

      const result = await service.haySesionAutenticada();

      expect(result).toBeFalse();
      expect(console.warn).toHaveBeenCalled();
    });

    it('dado que fetchAuthSession lanza un error, debe capturarlo y retornar false', async () => {
      const error = new Error('No autorizado');
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.reject(error));

      const result = await service.haySesionAutenticada();

      expect(result).toBeFalse();
      expect(console.error).toHaveBeenCalledWith('Error obteniendo sesión de Cognito', error);
    });
  });

  describe('esperarSesionAutenticada', () => {
    it('dado que la primera vez hay sesion, no debe demorar y retornar la sesion', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionWithTokens));

      const result = await service.esperarSesionAutenticada({ forceRefresh: true });

      expect(result).toEqual(mockSessionWithTokens);
      expect(service.amplify.fetchAuthSession).toHaveBeenCalledWith({ forceRefresh: true });
    });

    it('dado que la sesion es valida despues de varios intentos, debe reintentar usando setTimeout y retornar la sesion', fakeAsync(() => {
      const fetchSpy = spyOn(service.amplify, 'fetchAuthSession');
      fetchSpy.and.returnValues(
        Promise.resolve(mockSessionWithoutTokens),
        Promise.resolve(mockSessionWithoutTokens),
        Promise.resolve(mockSessionWithTokens)
      );

      let result: import('aws-amplify/auth').AuthSession | null | undefined;
      service.esperarSesionAutenticada({ reintentos: 3, intervaloMs: 100 }).then(res => {
        result = res;
      });

      tick();
      tick(100);
      tick(100);

      expect(result).toEqual(mockSessionWithTokens);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    }));

    it('dado que se acaban los reintentos y no hay sesion, debe retornar null', fakeAsync(() => {
      const fetchSpy = spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(null as unknown as AuthSession));

      let result: import('aws-amplify/auth').AuthSession | null | undefined;
      service.esperarSesionAutenticada({ reintentos: 2, intervaloMs: 50 }).then(res => {
        result = res;
      });

      tick();
      tick(50);
      tick(50);
      tick(50);

      expect(result).toBeNull();
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    }));
  });

  describe('obtenerAccessTokenParaApi', () => {
    it('dado que hay sesion, debe retornar el accessToken', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionWithTokens));

      const result = await service.obtenerAccessTokenParaApi();

      expect(result).toBe('access-123');
    });

    it('dado que no hay sesion, debe retornar null', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionWithoutTokens));

      const result = await service.obtenerAccessTokenParaApi();

      expect(result).toBeNull();
    });
  });

  describe('obtenerIdToken', () => {
    it('dado que hay sesion, debe retornar el idToken', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionWithTokens));

      const result = await service.obtenerIdToken();

      expect(result).toEqual(mockSessionWithTokens.tokens?.idToken?.toString() ?? null);
    });
  });

  describe('obtenerSub', () => {
    it('dado que la sesion tiene userSub, debe retornarlo', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve({ ...mockSessionWithTokens, userSub: 'sub-especifico' } as unknown as import('aws-amplify/auth').AuthSession));

      const result = await service.obtenerSub();

      expect(result).toBe('sub-especifico');
    });

    it('dado que la sesion no tiene userSub pero si en payload, debe retornarlo del payload', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve({ ...mockSessionWithTokens, userSub: undefined } as unknown as import('aws-amplify/auth').AuthSession));

      const result = await service.obtenerSub();

      expect(result).toBe('sub-123');
    });

    it('dado que no hay sesion, debe retornar undefined', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(null as unknown as AuthSession));

      const result = await service.obtenerSub();

      expect(result).toBeUndefined();
    });
  });

  describe('obtenerAtributosUsuario', () => {
    it('dado que hay payload en la sesion, debe retornar atributos mapeados', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionWithTokens));

      const result = await service.obtenerAtributosUsuario();

      expect(result).toEqual({
        sub: 'sub-123',
        email: 'test@test.com',
        nombre: 'Juan',
        apellido: 'Perez'
      });
    });

    it('dado que el payload tiene name en vez de given_name, debe mapearlo al nombre', async () => {
      const mockSessionName = {
        tokens: {
          accessToken: 'access',
          idToken: {
            payload: { name: 'Pedro' }
          }
        }
      };
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionName) as unknown as Promise<import('aws-amplify/auth').AuthSession>);

      const result = await service.obtenerAtributosUsuario();

      expect(result.nombre).toBe('Pedro');
      expect(result.apellido).toBeUndefined();
    });

    it('dado que no hay payload en idToken, debe retornar objeto vacio', async () => {
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve({ tokens: { accessToken: 'a' } } as unknown as AuthSession));

      const result = await service.obtenerAtributosUsuario();

      expect(result).toEqual({});
    });
  });

  describe('valorString (private)', () => {
    it('dado que los atributos del payload tienen espacios o no son strings, valorString los limpia', async () => {
      const mockSessionSpaces = {
        tokens: {
          accessToken: 'access',
          idToken: {
            payload: { given_name: '   ', family_name: 123 }
          }
        }
      };
      spyOn(service.amplify, 'fetchAuthSession').and.returnValue(Promise.resolve(mockSessionSpaces) as unknown as Promise<import('aws-amplify/auth').AuthSession>);

      const result = await service.obtenerAtributosUsuario();

      expect(result.nombre).toBeUndefined();
      expect(result.apellido).toBeUndefined();
    });
  });
});
