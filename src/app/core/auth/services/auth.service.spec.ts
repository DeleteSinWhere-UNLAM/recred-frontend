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
    it('dado que hay sesion, deberia devolver true', async () => {
      servicioSesion.haySesionAutenticada.and.resolveTo(true);

      expect(await service.isAutenticado()).toBeTrue();
    });

    it('dado que no hay sesion, deberia devolver false', async () => {
      servicioSesion.haySesionAutenticada.and.resolveTo(false);

      expect(await service.isAutenticado()).toBeFalse();
    });
  });

  describe('login', () => {
    it('dado que ya hay sesion autenticada, cuando hago login, no deberia limpiar el perfil ni intentar la redireccion', async () => {
      servicioSesion.haySesionAutenticada.and.resolveTo(true);

      await service.login();

      expect(servicioPerfil.limpiar).not.toHaveBeenCalled();
    });
  });

  describe('esperarAutenticacion', () => {
    it('dado una sesion disponible, deberia devolver true y pasar los reintentos configurados', async () => {
      servicioSesion.esperarSesionAutenticada.and.resolveTo({} as never);

      const resultado = await service.esperarAutenticacion();

      expect(resultado).toBeTrue();
      expect(servicioSesion.esperarSesionAutenticada).toHaveBeenCalledWith({
        reintentos: 20,
        intervaloMs: 250,
      });
    });

    it('dado que la sesion nunca aparece, deberia devolver false', async () => {
      servicioSesion.esperarSesionAutenticada.and.resolveTo(null);

      expect(await service.esperarAutenticacion()).toBeFalse();
    });
  });

  describe('getSub', () => {
    it('dado el service, cuando pido el sub, deberia delegar a obtenerSub del session service', async () => {
      servicioSesion.obtenerSub.and.resolveTo('sub-123');

      expect(await service.getSub()).toBe('sub-123');
    });

    it('dado que el session service no tiene sub, deberia devolver undefined', async () => {
      servicioSesion.obtenerSub.and.resolveTo(undefined);

      expect(await service.getSub()).toBeUndefined();
    });
  });
});
