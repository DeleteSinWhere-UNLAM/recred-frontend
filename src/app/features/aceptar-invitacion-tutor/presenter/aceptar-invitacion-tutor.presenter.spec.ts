import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/auth/services/auth.service';
import { InvitacionesTutorService } from '../../directivo/services/invitaciones-tutor.service';
import { InvitacionValidadaMother } from '../aceptar-invitacion-tutor.mother';
import { InvitacionTokenStorageService } from '../services/invitacion-token-storage.service';
import { AceptarInvitacionTutorPresenter } from './aceptar-invitacion-tutor.presenter';

describe('AceptarInvitacionTutorPresenter', () => {
  let presenter: AceptarInvitacionTutorPresenter;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;
  let servicioAuth: jasmine.SpyObj<AuthService>;
  let tokenStorage: jasmine.SpyObj<InvitacionTokenStorageService>;

  beforeEach(() => {
    servicioInvitaciones = jasmine.createSpyObj<InvitacionesTutorService>(
      'InvitacionesTutorService',
      ['validarToken'],
    );
    servicioAuth = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    tokenStorage = jasmine.createSpyObj<InvitacionTokenStorageService>(
      'InvitacionTokenStorageService',
      ['guardar', 'leer', 'limpiar'],
    );

    TestBed.configureTestingModule({
      providers: [
        AceptarInvitacionTutorPresenter,
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
        { provide: AuthService, useValue: servicioAuth },
        { provide: InvitacionTokenStorageService, useValue: tokenStorage },
      ],
    });

    presenter = TestBed.inject(AceptarInvitacionTutorPresenter);
  });

  it('dado el presenter recien creado, deberia tener los signals iniciales', () => {
    expect(presenter.loading()).toBeTrue();
    expect(presenter.invitacion()).toBeNull();
    expect(presenter.error()).toBeNull();
  });

  describe('validar', () => {
    it('dado un token null, cuando valido, deberia exponer un mensaje de token faltante y no pegarle al back', async () => {
      await whenValido(null);

      expect(servicioInvitaciones.validarToken).not.toHaveBeenCalled();
      expect(presenter.error()).toBe(
        'El link de invitación no es válido: falta el token.',
      );
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

      expect(presenter.error()).toBe(
        'No pudimos validar el link de invitación. Intentá más tarde.',
      );
    });
  });

  describe('iniciarLogin', () => {
    it('dado un token ya validado, cuando inicio login, deberia guardar el token y disparar authService.login', async () => {
      givenElBackDevuelve(InvitacionValidadaMother.crear());
      await whenValido('abc123');
      servicioAuth.login.and.resolveTo();

      await presenter.iniciarLogin();

      expect(tokenStorage.guardar).toHaveBeenCalledWith('abc123');
      expect(servicioAuth.login).toHaveBeenCalled();
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

  function whenValido(token: string | null): Promise<void> {
    return presenter.validar(token);
  }
});
