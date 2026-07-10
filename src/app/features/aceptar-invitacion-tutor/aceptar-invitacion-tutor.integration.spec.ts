import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { InvitacionesTutorService } from '../directivo/services/invitaciones-tutor.service';
import { AceptarInvitacionTutorPage } from './aceptar-invitacion-tutor.page';
import { InvitacionValidadaMother } from './aceptar-invitacion-tutor.mother';
import { InvitacionTokenStorageService } from './services/invitacion-token-storage.service';

describe('AceptarInvitacionTutor Integration', () => {
  let fixture: ComponentFixture<AceptarInvitacionTutorPage>;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;
  let servicioAuth: jasmine.SpyObj<AuthService>;
  let tokenStorage: jasmine.SpyObj<InvitacionTokenStorageService>;
  let perfilService: jasmine.SpyObj<PerfilService>;
  let router: jasmine.SpyObj<Router>;

  function armarTestBed(tokenQuery: string | null): void {
    servicioInvitaciones = jasmine.createSpyObj(
      'InvitacionesTutorService',
      ['validarToken', 'prepararCuenta', 'aceptarInvitacion'],
    );
    servicioAuth = jasmine.createSpyObj('AuthService', ['login', 'isAutenticado']);
    servicioAuth.login.and.resolveTo();
    servicioAuth.isAutenticado.and.resolveTo(false);
    tokenStorage = jasmine.createSpyObj(
      'InvitacionTokenStorageService',
      ['guardar', 'leer', 'limpiar'],
    );
    perfilService = jasmine.createSpyObj<PerfilService>('PerfilService', ['limpiar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [AceptarInvitacionTutorPage],
      providers: [
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
        { provide: AuthService, useValue: servicioAuth },
        { provide: InvitacionTokenStorageService, useValue: tokenStorage },
        { provide: PerfilService, useValue: perfilService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => tokenQuery } },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(AceptarInvitacionTutorPage);
  }

  it('dado un token valido en la url, cuando monto la pagina, deberia validar contra el back y renderizar el colegio', async () => {
    armarTestBed('abc123');
    givenElBackDevuelve(InvitacionValidadaMother.crear());

    await whenMontoLaPagina();

    expect(servicioInvitaciones.validarToken).toHaveBeenCalledWith('abc123');
    thenElDomContieneTexto('Colegio Demo');
  });

  it('dado un token que el back rechaza con 404, cuando monto la pagina, deberia mostrar el mensaje de error', async () => {
    armarTestBed('abc123');
    givenElBackFallaCon(404);

    await whenMontoLaPagina();

    thenElDomContieneTexto('Esta invitación no existe o ya fue usada.');
  });

  it('dada la invitacion de usuario existente, cuando hago click en continuar, deberia guardar el token y disparar login', async () => {
    armarTestBed('abc123');
    givenElBackDevuelve(InvitacionValidadaMother.crear());
    givenPreparacionDevuelve('LOGIN_REQUIRED');
    await whenMontoLaPagina();

    await whenHagoClickEn('.btn--primary');

    expect(servicioInvitaciones.prepararCuenta).toHaveBeenCalledWith('abc123', undefined);
    expect(tokenStorage.guardar).toHaveBeenCalledWith('abc123');
    expect(servicioAuth.login).toHaveBeenCalled();
  });

  it('dada la invitacion de usuario existente con sesion iniciada, cuando hago click en continuar, deberia aceptar y navegar al home tutor', async () => {
    armarTestBed('abc123');
    givenElBackDevuelve(InvitacionValidadaMother.crear());
    servicioAuth.isAutenticado.and.resolveTo(true);
    servicioInvitaciones.aceptarInvitacion.and.resolveTo();
    await whenMontoLaPagina();

    await whenHagoClickEn('.btn--primary');

    expect(servicioInvitaciones.prepararCuenta).not.toHaveBeenCalled();
    expect(servicioInvitaciones.aceptarInvitacion).toHaveBeenCalledWith('abc123');
    expect(tokenStorage.limpiar).toHaveBeenCalled();
    expect(perfilService.limpiar).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    expect(servicioAuth.login).not.toHaveBeenCalled();
  });

  it('dada la invitacion de usuario nuevo, cuando preparo cuenta, deberia pedir username antes de crearla', async () => {
    armarTestBed('abc123');
    givenElBackDevuelve(InvitacionValidadaMother.crear());
    givenPreparacionDevuelve('USERNAME_REQUIRED');
    await whenMontoLaPagina();

    await whenHagoClickEn('.btn--primary');

    thenElDomContieneTexto('Nombre de usuario');
    expect(tokenStorage.guardar).not.toHaveBeenCalled();
    expect(servicioAuth.login).not.toHaveBeenCalled();
  });

  it('dada la invitacion de usuario nuevo con username, cuando creo cuenta, deberia mostrar instrucciones sin iniciar login', async () => {
    armarTestBed('abc123');
    givenElBackDevuelve(InvitacionValidadaMother.crear());
    givenPreparacionDevuelve('USERNAME_REQUIRED');
    await whenMontoLaPagina();
    await whenHagoClickEn('.btn--primary');
    givenPreparacionDevuelve('ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT');

    whenCompletoCampo('input[autocomplete="username"]', 'arruaclotilde');
    await whenHagoClickEn('.btn--primary');

    thenElDomContieneTexto('Te enviamos usuario y contraseña temporal');
    expect(servicioInvitaciones.prepararCuenta).toHaveBeenCalledWith('abc123', 'arruaclotilde');
    expect(tokenStorage.guardar).toHaveBeenCalledWith('abc123');
    expect(servicioAuth.login).not.toHaveBeenCalled();
  });

  function givenElBackDevuelve(
    invitacion: ReturnType<typeof InvitacionValidadaMother.crear>,
  ): void {
    servicioInvitaciones.validarToken.and.resolveTo(invitacion);
  }

  function givenElBackFallaCon(status: number): void {
    servicioInvitaciones.validarToken.and.rejectWith(new HttpErrorResponse({ status }));
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

  async function whenMontoLaPagina(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function whenHagoClickEn(selector: string): Promise<void> {
    const btn = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function whenCompletoCampo(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
