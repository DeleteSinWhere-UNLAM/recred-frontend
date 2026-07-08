import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { InvitacionTutor } from '../directivo/models/invitacion-tutor.model';
import { AceptarInvitacionTutorPage } from './aceptar-invitacion-tutor.page';
import { AceptarInvitacionTutorPresenter } from './presenter/aceptar-invitacion-tutor.presenter';
import { InvitacionValidadaMother } from './aceptar-invitacion-tutor.mother';

interface PresenterStub {
  loading: () => boolean;
  error: () => string | null;
  invitacion: () => InvitacionTutor | null;
  validar: jasmine.Spy;
  iniciarLogin: jasmine.Spy;
}

describe('AceptarInvitacionTutorPage', () => {
  let fixture: ComponentFixture<AceptarInvitacionTutorPage>;
  let presenterStub: PresenterStub;
  let loadingSignal: ReturnType<typeof signal<boolean>>;
  let errorSignal: ReturnType<typeof signal<string | null>>;
  let invitacionSignal: ReturnType<typeof signal<InvitacionTutor | null>>;

  function armarTestBed(tokenQuery: string | null): void {
    loadingSignal = signal(true);
    errorSignal = signal<string | null>(null);
    invitacionSignal = signal<InvitacionTutor | null>(null);

    presenterStub = {
      loading: loadingSignal,
      error: errorSignal,
      invitacion: invitacionSignal,
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

    thenElDomContieneTexto('Validando tu invitación');
  });

  it('dado un error en el presenter, deberia mostrar el mensaje de error', async () => {
    armarTestBed('abc123');
    loadingSignal.set(false);
    errorSignal.set('Esta invitación venció.');

    await whenMontoLaPagina();

    thenElDomContieneTexto('No podemos usar este link');
    thenElDomContieneTexto('Esta invitación venció.');
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

  async function whenMontoLaPagina(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function whenHagoClickEn(selector: string): void {
    const btn = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLButtonElement;
    btn.click();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
