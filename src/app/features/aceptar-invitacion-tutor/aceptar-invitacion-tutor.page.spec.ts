import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import {
  InvitacionTutor,
  ResultadoPreparacionCuentaTutor,
} from '../directivo/models/invitacion-tutor.model';
import { AceptarInvitacionTutorPage } from './aceptar-invitacion-tutor.page';
import { AceptarInvitacionTutorPresenter } from './presenter/aceptar-invitacion-tutor.presenter';
import { InvitacionValidadaMother } from './aceptar-invitacion-tutor.mother';

interface PresenterStub {
  loading: () => boolean;
  error: () => string | null;
  invitacion: () => InvitacionTutor | null;
  preparandoCuenta: () => boolean;
  resultadoPreparacion: () => ResultadoPreparacionCuentaTutor | null;
  usernameError: () => string | null;
  validar: jasmine.Spy;
  iniciarLogin: jasmine.Spy;
}

describe('AceptarInvitacionTutorPage', () => {
  let fixture: ComponentFixture<AceptarInvitacionTutorPage>;
  let presenterStub: PresenterStub;
  let loadingSignal: ReturnType<typeof signal<boolean>>;
  let errorSignal: ReturnType<typeof signal<string | null>>;
  let invitacionSignal: ReturnType<typeof signal<InvitacionTutor | null>>;
  let preparandoCuentaSignal: ReturnType<typeof signal<boolean>>;
  let resultadoPreparacionSignal: ReturnType<typeof signal<ResultadoPreparacionCuentaTutor | null>>;
  let usernameErrorSignal: ReturnType<typeof signal<string | null>>;

  function armarTestBed(tokenQuery: string | null): void {
    loadingSignal = signal(true);
    errorSignal = signal<string | null>(null);
    invitacionSignal = signal<InvitacionTutor | null>(null);
    preparandoCuentaSignal = signal(false);
    resultadoPreparacionSignal = signal<ResultadoPreparacionCuentaTutor | null>(null);
    usernameErrorSignal = signal<string | null>(null);

    presenterStub = {
      loading: loadingSignal,
      error: errorSignal,
      invitacion: invitacionSignal,
      preparandoCuenta: preparandoCuentaSignal,
      resultadoPreparacion: resultadoPreparacionSignal,
      usernameError: usernameErrorSignal,
      validar: jasmine.createSpy('validar').and.resolveTo(),
      iniciarLogin: jasmine.createSpy('iniciarLogin').and.resolveTo(),
    };

    TestBed.configureTestingModule({
      imports: [AceptarInvitacionTutorPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => tokenQuery } },
          },
        },
      ],
    }).overrideComponent(AceptarInvitacionTutorPage, {
      add: {
        providers: [
          { provide: AceptarInvitacionTutorPresenter, useValue: presenterStub },
        ],
      },
    });

    fixture = TestBed.createComponent(AceptarInvitacionTutorPage);
  }

  it('dado que se monta con un token en la query, deberia invocar validar con ese token', async () => {
    armarTestBed('abc123');

    await whenMontoLaPagina();

    expect(presenterStub.validar).toHaveBeenCalledWith('abc123');
  });

  it('dado que se monta sin token en la query, deberia invocar validar con null', async () => {
    armarTestBed(null);

    await whenMontoLaPagina();

    expect(presenterStub.validar).toHaveBeenCalledWith(null);
  });

  it('dado que el presenter esta cargando, deberia mostrar el estado de validando', async () => {
    armarTestBed('abc123');

    await whenMontoLaPagina();

    thenElDomContieneTexto('Validando tu invitacion');
  });

  it('dado un error en el presenter, deberia mostrar el mensaje de error', async () => {
    armarTestBed('abc123');
    loadingSignal.set(false);
    errorSignal.set('Esta invitacion vencio.');

    await whenMontoLaPagina();

    thenElDomContieneTexto('No podemos usar este link');
    thenElDomContieneTexto('Esta invitacion vencio.');
  });

  it('dada una invitacion valida, cuando renderiza, deberia mostrar el nombre del colegio y el email invitado', async () => {
    armarTestBed('abc123');
    loadingSignal.set(false);
    invitacionSignal.set(InvitacionValidadaMother.crear());

    await whenMontoLaPagina();

    thenElDomContieneTexto('Colegio Demo');
    thenElDomContieneTexto('maria.tutora@test.com');
  });

  it('dada una invitacion valida, cuando hago click en continuar, deberia disparar iniciarLogin del presenter', async () => {
    armarTestBed('abc123');
    loadingSignal.set(false);
    invitacionSignal.set(InvitacionValidadaMother.crear());
    await whenMontoLaPagina();

    whenHagoClickEn('.btn--primary');

    expect(presenterStub.iniciarLogin).toHaveBeenCalled();
  });

  it('dado que falta username, cuando renderiza y completo el campo, deberia enviarlo al presenter', async () => {
    armarTestBed('abc123');
    loadingSignal.set(false);
    invitacionSignal.set(InvitacionValidadaMother.crear());
    resultadoPreparacionSignal.set('USERNAME_REQUIRED');
    await whenMontoLaPagina();

    whenCompletoCampo('input[autocomplete="username"]', 'arruaclotilde');
    whenHagoClickEn('.btn--primary');

    thenElDomContieneTexto('Nombre de usuario');
    expect(presenterStub.iniciarLogin).toHaveBeenCalledWith('arruaclotilde');
  });

  it('dado que falta username y hay error, deberia mostrar el mensaje del campo', async () => {
    armarTestBed('abc123');
    loadingSignal.set(false);
    invitacionSignal.set(InvitacionValidadaMother.crear());
    resultadoPreparacionSignal.set('USERNAME_REQUIRED');
    usernameErrorSignal.set('El nombre de usuario ya esta en uso');

    await whenMontoLaPagina();

    thenElDomContieneTexto('El nombre de usuario ya esta en uso');
  });

  it('dada una cuenta temporal creada, deberia mostrar instrucciones para iniciar sesion', async () => {
    armarTestBed('abc123');
    loadingSignal.set(false);
    invitacionSignal.set(InvitacionValidadaMother.crear());
    resultadoPreparacionSignal.set('ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT');

    await whenMontoLaPagina();

    thenElDomContieneTexto('Te enviamos usuario y contrasena temporal');
    thenElDomContieneTexto('Iniciar sesion');
  });

  async function whenMontoLaPagina(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function whenHagoClickEn(selector: string): void {
    const btn = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLButtonElement;
    btn.click();
  }

  function whenCompletoCampo(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
