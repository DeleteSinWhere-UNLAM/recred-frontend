import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { InvitacionesTutorService } from '../directivo/services/invitaciones-tutor.service';
import { AceptarInvitacionTutorPage } from './aceptar-invitacion-tutor.page';
import { InvitacionValidadaMother } from './aceptar-invitacion-tutor.mother';
import { InvitacionTokenStorageService } from './services/invitacion-token-storage.service';

describe('AceptarInvitacionTutor Integration', () => {
  let fixture: ComponentFixture<AceptarInvitacionTutorPage>;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;
  let servicioAuth: jasmine.SpyObj<AuthService>;
  let tokenStorage: jasmine.SpyObj<InvitacionTokenStorageService>;

  function armarTestBed(tokenQuery: string | null): void {
    servicioInvitaciones = jasmine.createSpyObj('InvitacionesTutorService', ['validarToken']);
    servicioAuth = jasmine.createSpyObj('AuthService', ['login']);
    servicioAuth.login.and.resolveTo();
    tokenStorage = jasmine.createSpyObj('InvitacionTokenStorageService', ['guardar', 'leer', 'limpiar']);

    TestBed.configureTestingModule({
      imports: [AceptarInvitacionTutorPage],
      providers: [
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
        { provide: AuthService, useValue: servicioAuth },
        { provide: InvitacionTokenStorageService, useValue: tokenStorage },
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

  it('dada la invitacion mostrada, cuando hago click en continuar, deberia guardar el token y disparar login', async () => {
    armarTestBed('abc123');
    givenElBackDevuelve(InvitacionValidadaMother.crear());
    await whenMontoLaPagina();

    whenHagoClickEn('.btn--primary');

    expect(tokenStorage.guardar).toHaveBeenCalledWith('abc123');
    expect(servicioAuth.login).toHaveBeenCalled();
  });

  function givenElBackDevuelve(
    invitacion: ReturnType<typeof InvitacionValidadaMother.crear>,
  ): void {
    servicioInvitaciones.validarToken.and.resolveTo(invitacion);
  }

  function givenElBackFallaCon(status: number): void {
    servicioInvitaciones.validarToken.and.rejectWith(new HttpErrorResponse({ status }));
  }

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
