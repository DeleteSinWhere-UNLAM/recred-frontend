import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { InvitacionTutor } from '../models/invitacion-tutor.model';
import { InvitarTutorPage } from './invitar-tutor.page';
import { InvitarTutorPresenter } from './presenter/invitar-tutor.presenter';
import { InvitacionTutorMother } from './invitar-tutor.mother';

interface PresenterStub {
  loading: () => boolean;
  error: () => string | null;
  resultado: () => InvitacionTutor | null;
  invitar: jasmine.Spy;
  volver: jasmine.Spy;
  limpiarResultado: jasmine.Spy;
}

describe('InvitarTutorPage', () => {
  let fixture: ComponentFixture<InvitarTutorPage>;
  let presenterStub: PresenterStub;
  let loadingSignal: ReturnType<typeof signal<boolean>>;
  let errorSignal: ReturnType<typeof signal<string | null>>;
  let resultadoSignal: ReturnType<typeof signal<InvitacionTutor | null>>;

  beforeEach(async () => {
    loadingSignal = signal(false);
    errorSignal = signal<string | null>(null);
    resultadoSignal = signal<InvitacionTutor | null>(null);

    presenterStub = {
      loading: loadingSignal,
      error: errorSignal,
      resultado: resultadoSignal,
      invitar: jasmine.createSpy('invitar').and.resolveTo(),
      volver: jasmine.createSpy('volver'),
      limpiarResultado: jasmine.createSpy('limpiarResultado'),
    };

    await TestBed.configureTestingModule({
      imports: [InvitarTutorPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(InvitarTutorPage, {
        add: { providers: [{ provide: InvitarTutorPresenter, useValue: presenterStub }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(InvitarTutorPage);
  });

  it('dado que se monta la pagina, deberia crearse correctamente', () => {
    whenMontoLaPagina();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('dado que no hay resultado todavia, deberia renderizar el form con el input de email', () => {
    whenMontoLaPagina();

    thenElDomTiene('input[formControlName="email"]');
    thenElDomTiene('input[formControlName="firstName"]');
    thenElDomTiene('input[formControlName="lastName"]');
    thenElDomTiene('input[formControlName="phone"]');
  });

  it('dado un email vacio, cuando submiteo, no deberia invocar al presenter', async () => {
    whenMontoLaPagina();

    await whenSubmiteoElForm();

    expect(presenterStub.invitar).not.toHaveBeenCalled();
  });

  it('dado un email invalido, cuando submiteo, no deberia invocar al presenter', async () => {
    whenMontoLaPagina();
    whenSeteoElEmail('no-es-email');

    await whenSubmiteoElForm();

    expect(presenterStub.invitar).not.toHaveBeenCalled();
  });

  it('dado un email valido, cuando submiteo, deberia invocar al presenter con email normalizado a minusculas', async () => {
    whenMontoLaPagina();
    whenSeteoElEmail('MARIA@TEST.COM');
    whenSeteoElCampo('firstName', ' Maria ');

    await whenSubmiteoElForm();

    expect(presenterStub.invitar).toHaveBeenCalledWith({
      email: 'maria@test.com',
      firstName: 'Maria',
      lastName: undefined,
      phone: undefined,
    });
  });

  it('dado un resultado CREATED en el presenter, cuando renderiza, deberia mostrar el mensaje de invitacion enviada y el link en el input', () => {
    resultadoSignal.set(InvitacionTutorMother.creada());

    whenMontoLaPagina();

    thenElDomContieneTexto('Invitación enviada');
    const link = (fixture.nativeElement as HTMLElement).querySelector(
      '#invitation-link',
    ) as HTMLInputElement;
    expect(link?.value).toBe('http://localhost:4200/invitaciones/tutor?token=abc123');
  });

  it('dado un resultado ALREADY_ASSOCIATED sin link, cuando renderiza, deberia mostrar el mensaje de ya asociado sin caja de link', () => {
    resultadoSignal.set(InvitacionTutorMother.yaAsociada());

    whenMontoLaPagina();

    thenElDomContieneTexto('Ya está asociado');
    expect((fixture.nativeElement as HTMLElement).querySelector('.link-box')).toBeNull();
  });

  it('dado un error en el presenter y sin resultado, cuando renderiza, deberia mostrar el alert de error', () => {
    errorSignal.set('Email invalido');

    whenMontoLaPagina();

    thenElDomContieneTexto('Email invalido');
  });

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
  }

  function whenSeteoElEmail(valor: string): void {
    fixture.componentInstance['form'].controls.email.setValue(valor);
  }

  function whenSeteoElCampo(
    campo: 'firstName' | 'lastName' | 'phone',
    valor: string,
  ): void {
    fixture.componentInstance['form'].controls[campo].setValue(valor);
  }

  async function whenSubmiteoElForm(): Promise<void> {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function thenElDomTiene(selector: string): void {
    expect((fixture.nativeElement as HTMLElement).querySelector(selector)).toBeTruthy();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
