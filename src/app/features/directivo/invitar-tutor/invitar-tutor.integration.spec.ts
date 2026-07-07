import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { InvitacionesTutorService } from '../services/invitaciones-tutor.service';
import { InvitarTutorPage } from './invitar-tutor.page';
import {
  InvitacionTutorMother,
  InvitarTutorPayloadMother,
} from './invitar-tutor.mother';

describe('InvitarTutor Integration', () => {
  let fixture: ComponentFixture<InvitarTutorPage>;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    servicioInvitaciones = jasmine.createSpyObj('InvitacionesTutorService', ['invitarTutor']);

    await TestBed.configureTestingModule({
      imports: [InvitarTutorPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
      ],
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(InvitarTutorPage);
  });

  it('dado un email valido, cuando submiteo, deberia llamar al back y renderizar el resultado CREATED', async () => {
    givenElBackDevuelve(InvitacionTutorMother.creada());
    whenMontoLaPagina();

    whenCompletoElForm(InvitarTutorPayloadMother.crear());
    await whenSubmiteoElForm();

    expect(servicioInvitaciones.invitarTutor).toHaveBeenCalled();
    thenElDomContieneTexto('Invitación enviada');
    thenElDomContieneTexto('Colegio Demo');
  });

  it('dado que el back rechaza con 400 y mensaje, cuando submiteo, deberia mostrar el mensaje del back', async () => {
    givenElBackFallaCon(400, 'Email duplicado');
    whenMontoLaPagina();

    whenCompletoElForm(InvitarTutorPayloadMother.crear());
    await whenSubmiteoElForm();
    fixture.detectChanges();

    thenElDomContieneTexto('Email duplicado');
  });

  it('dado un resultado en pantalla, cuando hago click en volver, deberia navegar a /directivo', async () => {
    givenElBackDevuelve(InvitacionTutorMother.creada());
    whenMontoLaPagina();
    whenCompletoElForm(InvitarTutorPayloadMother.crear());
    await whenSubmiteoElForm();
    fixture.detectChanges();

    whenHagoClickEn('.btn--secondary');

    expect(navigateSpy).toHaveBeenCalledWith(['/directivo']);
  });

  function givenElBackDevuelve(invitacion: ReturnType<typeof InvitacionTutorMother.creada>): void {
    servicioInvitaciones.invitarTutor.and.resolveTo(invitacion);
  }

  function givenElBackFallaCon(status: number, mensaje: string): void {
    servicioInvitaciones.invitarTutor.and.rejectWith(
      new HttpErrorResponse({ status, error: { message: mensaje } }),
    );
  }

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
  }

  function whenCompletoElForm(payload: ReturnType<typeof InvitarTutorPayloadMother.crear>): void {
    const form = fixture.componentInstance['form'];
    form.controls.email.setValue(payload.email);
    form.controls.firstName.setValue(payload.firstName ?? '');
    form.controls.lastName.setValue(payload.lastName ?? '');
    form.controls.phone.setValue(payload.phone ?? '');
  }

  async function whenSubmiteoElForm(): Promise<void> {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function whenHagoClickEn(selector: string): void {
    const el = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLButtonElement;
    el.click();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
