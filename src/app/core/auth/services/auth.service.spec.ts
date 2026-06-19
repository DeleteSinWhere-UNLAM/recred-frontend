import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthService', () => {
  let service: AuthService;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let authSessionServiceSpy: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    const perfilSpy = jasmine.createSpyObj('PerfilService', ['limpiar']);
    const authSessionSpy = jasmine.createSpyObj('AuthSessionService', [
      'haySesionAutenticada',
      'esperarSesionAutenticada',
      'obtenerSub'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PerfilService, useValue: perfilSpy },
        { provide: AuthSessionService, useValue: authSessionSpy },
      ]
    });

    service = TestBed.inject(AuthService);
    perfilServiceSpy = TestBed.inject(PerfilService) as jasmine.SpyObj<PerfilService>;
    authSessionServiceSpy = TestBed.inject(AuthSessionService) as jasmine.SpyObj<AuthSessionService>;

    spyOn(service.amplify, 'signInWithRedirect').and.returnValue(Promise.resolve());
    spyOn(service.amplify, 'signOut').and.returnValue(Promise.resolve());
  });

  it('dado que se crea el servicio, debe estar definido', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('dado que ya existe una sesion autenticada, no debe iniciar el flujo de login ni limpiar el perfil', async () => {
      authSessionServiceSpy.haySesionAutenticada.and.returnValue(Promise.resolve(true));

      await service.login();

      expect(authSessionServiceSpy.haySesionAutenticada).toHaveBeenCalled();
      expect(perfilServiceSpy.limpiar).not.toHaveBeenCalled();
      expect(service.amplify.signInWithRedirect).not.toHaveBeenCalled();
    });

    it('dado que no hay sesion autenticada, debe limpiar el perfil y llamar a signInWithRedirect', async () => {
      authSessionServiceSpy.haySesionAutenticada.and.returnValue(Promise.resolve(false));

      await service.login();

      expect(authSessionServiceSpy.haySesionAutenticada).toHaveBeenCalled();
      expect(perfilServiceSpy.limpiar).toHaveBeenCalled();
      expect(service.amplify.signInWithRedirect).toHaveBeenCalledWith({
        options: { lang: 'es' }
      });
    });
  });

  describe('logout', () => {
    it('dado que se cierra sesion, debe limpiar el perfil y llamar a signOut de amplify', async () => {
      await service.logout();

      expect(perfilServiceSpy.limpiar).toHaveBeenCalled();
      expect(service.amplify.signOut).toHaveBeenCalled();
    });

    it('dado que signOut de amplify falla, debe capturar el error y no romper la ejecucion', async () => {
      const error = new Error('Error al cerrar sesion');
      (service.amplify.signOut as jasmine.Spy).and.returnValue(Promise.reject(error));
      spyOn(console, 'error');

      await service.logout();

      expect(perfilServiceSpy.limpiar).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error durante el signOut', error);
    });
  });

  describe('isAutenticado', () => {
    it('dado que se llama a isAutenticado, debe devolver lo que retorne AuthSessionService', async () => {
      authSessionServiceSpy.haySesionAutenticada.and.returnValue(Promise.resolve(true));

      const result = await service.isAutenticado();

      expect(result).toBeTrue();
      expect(authSessionServiceSpy.haySesionAutenticada).toHaveBeenCalled();
    });
  });

  describe('esperarAutenticacion', () => {
    it('dado que la sesion se obtiene correctamente, debe retornar true', async () => {
      authSessionServiceSpy.esperarSesionAutenticada.and.returnValue(Promise.resolve({} as unknown as import('aws-amplify/auth').AuthSession));

      const result = await service.esperarAutenticacion();

      expect(result).toBeTrue();
      expect(authSessionServiceSpy.esperarSesionAutenticada).toHaveBeenCalledWith({
        reintentos: 20,
        intervaloMs: 250,
      });
    });

    it('dado que la sesion no se obtiene luego de esperar, debe retornar false', async () => {
      authSessionServiceSpy.esperarSesionAutenticada.and.returnValue(Promise.resolve(null));

      const result = await service.esperarAutenticacion();

      expect(result).toBeFalse();
    });
  });

  describe('getSub', () => {
    it('dado que se pide el sub, debe devolver el sub del AuthSessionService', async () => {
      authSessionServiceSpy.obtenerSub.and.returnValue(Promise.resolve('mock-sub'));

      const result = await service.getSub();

      expect(result).toBe('mock-sub');
      expect(authSessionServiceSpy.obtenerSub).toHaveBeenCalled();
    });
  });
});
