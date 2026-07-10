import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { InvitacionesTutorService } from '../../directivo/services/invitaciones-tutor.service';
import { InvitacionValidadaMother } from '../aceptar-invitacion-tutor.mother';
import { InvitacionTokenStorageService } from '../services/invitacion-token-storage.service';
import { AceptarInvitacionTutorPresenter } from './aceptar-invitacion-tutor.presenter';

describe('AceptarInvitacionTutorPresenter', () => {
  let presenter: AceptarInvitacionTutorPresenter;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;
  let servicioAuth: jasmine.SpyObj<AuthService>;
  let tokenStorage: jasmine.SpyObj<InvitacionTokenStorageService>;
  let perfilService: jasmine.SpyObj<PerfilService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    servicioInvitaciones = jasmine.createSpyObj<InvitacionesTutorService>(
      'InvitacionesTutorService',
      ['validarToken', 'prepararCuenta', 'aceptarInvitacion'],
    );
    servicioAuth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'isAutenticado']);
    tokenStorage = jasmine.createSpyObj<InvitacionTokenStorageService>(
      'InvitacionTokenStorageService',
      ['guardar', 'leer', 'limpiar'],
    );
    perfilService = jasmine.createSpyObj<PerfilService>('PerfilService', ['limpiar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        AceptarInvitacionTutorPresenter,
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
        { provide: AuthService, useValue: servicioAuth },
        { provide: InvitacionTokenStorageService, useValue: tokenStorage },
        { provide: PerfilService, useValue: perfilService },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(AceptarInvitacionTutorPresenter);
  });

  it('dado el presenter recien creado, deberia tener los signals iniciales', () => {
    expect(presenter.loading()).toBeTrue();
    expect(presenter.invitacion()).toBeNull();
    expect(presenter.error()).toBeNull();
    expect(presenter.preparandoCuenta()).toBeFalse();
    expect(presenter.resultadoPreparacion()).toBeNull();
    expect(presenter.usernameError()).toBeNull();
  });

  describe('validar', () => {
    it('dado un token null, cuando valido, deberia exponer un mensaje de token faltante y no pegarle al back', async () => {
      await whenValido(null);

      expect(servicioInvitaciones.validarToken).not.toHaveBeenCalled();
      expect(presenter.error()).toBe('El link de invitación no es válido: falta el token.');
      expect(presenter.loading()).toBeFalse();
    });

    it('dado un token valido, cuando valido, deberia exponer la invitacion en el signal', async () => {
      const invitacion = InvitacionValidadaMother.crear();
      givenElBackDevuelve(invitacion);

      await whenValido('abc123');

      expect(servicioInvitaciones.validarToken).toHaveBeenCalledWith('abc123');
      expect(presenter.invitacion()).toEqual(invitacion);
      expect(presenter.error()).toBeNull();
      expect(presenter.loading()).toBeFalse();
    });

    it('dado un token que devuelve 404, cuando valido, deberia mostrar mensaje de invitacion inexistente', async () => {
      givenElBackFallaCon(404);

      await whenValido('abc123');

      expect(presenter.error()).toBe('Esta invitación no existe o ya fue usada.');
    });

    it('dado un token que devuelve 410, cuando valido, deberia mostrar mensaje de invitacion vencida', async () => {
      givenElBackFallaCon(410);

      await whenValido('abc123');

      expect(presenter.error()).toBe(
        'Esta invitación venció. Pedile a tu colegio que te reenvíe una nueva.',
      );
    });

    it('dado un token que devuelve 409, cuando valido, deberia mostrar mensaje de invitacion ya aceptada', async () => {
      givenElBackFallaCon(409);

      await whenValido('abc123');

      expect(presenter.error()).toBe('Esta invitación ya fue aceptada.');
    });

    it('dado un error 500 con mensaje del back, cuando valido, deberia usar ese mensaje', async () => {
      givenElBackFallaCon(500, 'Cayo el servidor');

      await whenValido('abc123');

      expect(presenter.error()).toBe('Cayo el servidor');
    });

    it('dado un error no HTTP, cuando valido, deberia usar el mensaje generico', async () => {
      servicioInvitaciones.validarToken.and.rejectWith(new Error('boom'));

      await whenValido('abc123');

      expect(presenter.error()).toBe('No pudimos validar el link de invitación. Intenta más tarde.');
    });

    it('dado un error 500 con solo mensaje en espanol, cuando valido, deberia usar ese mensaje', async () => {
      servicioInvitaciones.validarToken.and.rejectWith(
        new HttpErrorResponse({ status: 500, error: { mensaje: 'Fallo generico' } }),
      );

      await whenValido('abc123');

      expect(presenter.error()).toBe('Fallo generico');
    });

    it('dado un error 500 con body vacio, cuando valido, deberia caer al mensaje generico', async () => {
      servicioInvitaciones.validarToken.and.rejectWith(
        new HttpErrorResponse({ status: 500, error: {} }),
      );

      await whenValido('abc123');

      expect(presenter.error()).toBe('No pudimos validar el link de invitación. Intenta más tarde.');
    });
  });

  describe('iniciarLogin errores del back', () => {
    it('dado un error 500 con solo mensaje en espanol al preparar cuenta, deberia usar ese mensaje', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      await whenValido('abc123');
      servicioInvitaciones.prepararCuenta.and.rejectWith(
        new HttpErrorResponse({ status: 500, error: { mensaje: 'Detalle en espanol' } }),
      );

      await presenter.iniciarLogin();

      expect(presenter.error()).toBe('Detalle en espanol');
    });

    it('dado un error 500 con body vacio al preparar cuenta, deberia caer al mensaje generico', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      await whenValido('abc123');
      servicioInvitaciones.prepararCuenta.and.rejectWith(
        new HttpErrorResponse({ status: 500, error: {} }),
      );

      await presenter.iniciarLogin();

      expect(presenter.error()).toBe('No pudimos preparar tu cuenta. Intenta nuevamente en unos minutos.');
    });

    it('dado un error no HTTP al preparar cuenta, deberia usar el mensaje generico', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      await whenValido('abc123');
      servicioInvitaciones.prepararCuenta.and.rejectWith(new Error('boom'));

      await presenter.iniciarLogin();

      expect(presenter.error()).toBe('No pudimos preparar tu cuenta. Intenta nuevamente en unos minutos.');
    });

    it('dado un error 500 con err.error string en validar, deberia caer al mensaje generico', async () => {
      servicioInvitaciones.validarToken.and.rejectWith(
        new HttpErrorResponse({ status: 500, error: 'texto plano' }),
      );

      await whenValido('abc123');

      expect(presenter.error()).toBe('No pudimos validar el link de invitación. Intenta más tarde.');
    });

    it('dado un error 500 con err.error string en preparar cuenta, deberia caer al mensaje generico', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      await whenValido('abc123');
      servicioInvitaciones.prepararCuenta.and.rejectWith(
        new HttpErrorResponse({ status: 500, error: 'texto plano' }),
      );

      await presenter.iniciarLogin();

      expect(presenter.error()).toBe('No pudimos preparar tu cuenta. Intenta nuevamente en unos minutos.');
    });

    it('dado que preparar cuenta falla mientras hay USERNAME_REQUIRED, deberia poner el error en el signal de username', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      givenPreparacionDevuelve('USERNAME_REQUIRED');
      givenUsuarioNoAutenticado();
      await whenValido('abc123');
      await presenter.iniciarLogin();
      servicioInvitaciones.prepararCuenta.and.rejectWith(
        new HttpErrorResponse({ status: 500, error: { message: 'Boom al crear' } }),
      );

      await presenter.iniciarLogin('parent');

      expect(presenter.usernameError()).toBe('Boom al crear');
    });
  });

  describe('iniciarLogin', () => {
    it('dado usuario existente no autenticado, cuando inicio login, deberia preparar cuenta, guardar token y disparar authService.login', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      givenPreparacionDevuelve('LOGIN_REQUIRED');
      givenUsuarioNoAutenticado();
      await whenValido('abc123');
      servicioAuth.login.and.resolveTo();

      await presenter.iniciarLogin();

      expect(servicioInvitaciones.prepararCuenta).toHaveBeenCalledWith('abc123', undefined);
      expect(tokenStorage.guardar).toHaveBeenCalledWith('abc123');
      expect(servicioAuth.login).toHaveBeenCalled();
    });

    it('dado usuario existente autenticado, cuando inicio login, deberia aceptar la invitacion y redirigir al home tutor', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      givenUsuarioAutenticado();
      servicioInvitaciones.aceptarInvitacion.and.resolveTo();
      await whenValido('abc123');

      await presenter.iniciarLogin();

      expect(servicioInvitaciones.prepararCuenta).not.toHaveBeenCalled();
      expect(servicioInvitaciones.aceptarInvitacion).toHaveBeenCalledWith('abc123');
      expect(tokenStorage.limpiar).toHaveBeenCalled();
      expect(perfilService.limpiar).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(servicioAuth.login).not.toHaveBeenCalled();
    });

    it('dado usuario nuevo sin username, cuando inicio login, deberia pedir nombre de usuario', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      givenPreparacionDevuelve('USERNAME_REQUIRED');
      givenUsuarioNoAutenticado();
      await whenValido('abc123');

      await presenter.iniciarLogin();

      expect(tokenStorage.guardar).not.toHaveBeenCalled();
      expect(presenter.resultadoPreparacion()).toBe('USERNAME_REQUIRED');
      expect(servicioAuth.login).not.toHaveBeenCalled();
    });

    it('dado usuario nuevo con username, cuando preparo cuenta, deberia crearla y mostrar credenciales enviadas', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      givenPreparacionDevuelve('USERNAME_REQUIRED');
      givenUsuarioNoAutenticado();
      await whenValido('abc123');
      await presenter.iniciarLogin();
      givenPreparacionDevuelve('ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT');

      await presenter.iniciarLogin(' PadreUno ');

      expect(servicioInvitaciones.prepararCuenta).toHaveBeenCalledWith('abc123', 'padreuno');
      expect(tokenStorage.guardar).toHaveBeenCalledWith('abc123');
      expect(presenter.resultadoPreparacion()).toBe('ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT');
      expect(presenter.usernameError()).toBeNull();
    });

    it('dado usuario nuevo sin completar username, cuando intenta crear cuenta, deberia mostrar error de campo', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      givenPreparacionDevuelve('USERNAME_REQUIRED');
      givenUsuarioNoAutenticado();
      await whenValido('abc123');
      await presenter.iniciarLogin();

      await presenter.iniciarLogin('   ');

      expect(servicioInvitaciones.prepararCuenta).toHaveBeenCalledTimes(1);
      expect(presenter.usernameError()).toBe('Ingresa un nombre de usuario.');
    });

    it('dada cuenta temporal creada, cuando inicio login otra vez, deberia disparar authService.login sin preparar de nuevo', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      givenPreparacionDevuelve('USERNAME_REQUIRED');
      givenUsuarioNoAutenticado();
      await whenValido('abc123');
      await presenter.iniciarLogin();
      givenPreparacionDevuelve('ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT');
      await presenter.iniciarLogin('parent');
      servicioAuth.login.and.resolveTo();

      await presenter.iniciarLogin();

      expect(servicioInvitaciones.prepararCuenta).toHaveBeenCalledTimes(2);
      expect(servicioAuth.login).toHaveBeenCalled();
    });

    it('dado que preparar cuenta falla, cuando inicio login, deberia mostrar mensaje de error', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      await whenValido('abc123');
      servicioInvitaciones.prepararCuenta.and.rejectWith(
        new HttpErrorResponse({ status: 500, error: { message: 'No se pudo crear' } }),
      );

      await presenter.iniciarLogin();

      expect(presenter.error()).toBe('No se pudo crear');
      expect(servicioAuth.login).not.toHaveBeenCalled();
    });

    it('dado que no hay token validado, cuando inicio login, no deberia disparar authService.login', async () => {
      await presenter.iniciarLogin();

      expect(tokenStorage.guardar).not.toHaveBeenCalled();
      expect(servicioAuth.login).not.toHaveBeenCalled();
    });
  });

  function givenElBackDevuelve(
    invitacion: ReturnType<typeof InvitacionValidadaMother.crear>,
  ): void {
    servicioInvitaciones.validarToken.and.resolveTo(invitacion);
  }

  function givenElBackFallaCon(status: number, mensaje?: string): void {
    servicioInvitaciones.validarToken.and.rejectWith(
      new HttpErrorResponse({
        status,
        error: mensaje ? { message: mensaje } : null,
      }),
    );
  }

  function givenPreparacionDevuelve(
    result: 'LOGIN_REQUIRED' | 'USERNAME_REQUIRED' | 'ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT',
  ): void {
    servicioInvitaciones.prepararCuenta.and.resolveTo({
      invitationId: 'inv-1',
      schoolId: 'school-1',
      schoolName: 'Colegio Demo',
      email: 'maria.tutora@test.com',
      result,
    });
  }

  function givenUsuarioAutenticado(): void {
    servicioAuth.isAutenticado.and.resolveTo(true);
  }

  function givenUsuarioNoAutenticado(): void {
    servicioAuth.isAutenticado.and.resolveTo(false);
  }

  function whenValido(token: string | null): Promise<void> {
    return presenter.validar(token);
  }
});
