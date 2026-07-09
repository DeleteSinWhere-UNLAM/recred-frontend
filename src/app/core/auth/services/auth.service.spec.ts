import { TestBed } from '@angular/core/testing';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthService', () => {
  let service: AuthService;
  let servicioSesion: jasmine.SpyObj<AuthSessionService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    servicioSesion = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'haySesionAutenticada',
      'esperarSesionAutenticada',
      'obtenerSub',
    ]);
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['limpiar']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthSessionService, useValue: servicioSesion },
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  describe('isAutenticado', () => {
    it('dado que hay sesion, cuando consulto isAutenticado, deberia devolver true', async () => {
      givenSesionAutenticada(true);

      expect(await service.isAutenticado()).toBeTrue();
    });

    it('dado que no hay sesion, cuando consulto isAutenticado, deberia devolver false', async () => {
      givenSesionAutenticada(false);

      expect(await service.isAutenticado()).toBeFalse();
    });
  });

  describe('login', () => {
    it('dado que ya hay sesion autenticada, cuando hago login, no deberia limpiar el perfil ni redirigir', async () => {
      givenSesionAutenticada(true);

      await service.login();

      expect(servicioPerfil.limpiar).not.toHaveBeenCalled();
    });

    it('dado que no hay sesion, cuando hago login, deberia limpiar el perfil antes de redirigir', async () => {
      givenSesionAutenticada(false);

      try {
        await service.login();
      } catch {
        /* noop */
      }

      expect(servicioPerfil.limpiar).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('cuando llamo logout, deberia limpiar el perfil en el finally', async () => {
      try {
        await service.logout();
      } catch {
        /* noop */
      }

      expect(servicioPerfil.limpiar).toHaveBeenCalled();
    });
  });

  describe('esperarAutenticacion', () => {
    it('dado una sesion disponible, cuando espero, deberia devolver true y pasar los reintentos configurados', async () => {
      givenEsperarSesionResuelveCon({} as never);

      const resultado = await service.esperarAutenticacion();

      expect(resultado).toBeTrue();
      expect(servicioSesion.esperarSesionAutenticada).toHaveBeenCalledWith({
        reintentos: 20,
        intervaloMs: 250,
      });
    });

    it('dado que la sesion nunca aparece, cuando espero, deberia devolver false', async () => {
      givenEsperarSesionResuelveCon(null);

      expect(await service.esperarAutenticacion()).toBeFalse();
    });
  });

  describe('getSub', () => {
    it('dado el service, cuando pido el sub, deberia delegar a obtenerSub del session service', async () => {
      givenSubDelSessionService('sub-123');

      expect(await service.getSub()).toBe('sub-123');
    });

    it('dado que el session service no tiene sub, cuando pido el sub, deberia devolver undefined', async () => {
      givenSubDelSessionService(undefined);

      expect(await service.getSub()).toBeUndefined();
    });
  });

  function givenSesionAutenticada(autenticada: boolean): void {
    servicioSesion.haySesionAutenticada.and.resolveTo(autenticada);
  }

  function givenEsperarSesionResuelveCon(valor: Awaited<ReturnType<AuthSessionService['esperarSesionAutenticada']>>): void {
    servicioSesion.esperarSesionAutenticada.and.resolveTo(valor);
  }

  function givenSubDelSessionService(sub: string | undefined): void {
    servicioSesion.obtenerSub.and.resolveTo(sub);
  }
});
