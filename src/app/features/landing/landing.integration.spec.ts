import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { LandingPage } from './landing.page';
import { LandingCtaButtonComponent } from './components/landing-cta-button/landing-cta-button.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { InvitacionTokenStorageService } from '../aceptar-invitacion-tutor/services/invitacion-token-storage.service';
import { InvitacionesTutorService } from '../directivo/services/invitaciones-tutor.service';
import { CtaLanding } from './models/cta-landing.model';
import { PerfilMother } from '../../data-access/services/alumno.mother';
import { RolUsuario } from '../../data-access/models/perfil.model';

@Component({
  selector: 'app-landing-cta-button',
  template: '<button class="cta-stub" (click)="clicked.emit()">{{ cta?.texto }}</button>',
  standalone: true,
})
class LandingCtaButtonStub {
  @Input() cta!: CtaLanding;
  @Output() clicked = new EventEmitter<void>();
}

describe('Landing Integration', () => {
  let fixture: ComponentFixture<LandingPage>;
  let component: LandingPage;
  let router: Router;
  let servicioAuth: jasmine.SpyObj<AuthService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioTokenInvitacion: jasmine.SpyObj<InvitacionTokenStorageService>;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;

  beforeEach(async () => {
    servicioAuth = jasmine.createSpyObj('AuthService', ['isAutenticado', 'esperarAutenticacion', 'login']);
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['cargarHijosDelTutor']);
    servicioTokenInvitacion = jasmine.createSpyObj('InvitacionTokenStorageService', ['leer', 'guardar', 'limpiar']);
    servicioTokenInvitacion.leer.and.returnValue(null);
    servicioInvitaciones = jasmine.createSpyObj('InvitacionesTutorService', ['aceptarInvitacion']);
    servicioAuth.login.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: servicioAuth },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: InvitacionTokenStorageService, useValue: servicioTokenInvitacion },
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
      ],
    })
      .overrideComponent(LandingPage, {
        remove: { imports: [LandingCtaButtonComponent] },
        add: { imports: [LandingCtaButtonStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('dado un usuario no autenticado, cuando se monta la pagina, deberia renderizar los CTAs en el DOM (registro en header desktop y en seccion mobile, login en main)', fakeAsync(() => {
    givenUsuarioNoAutenticado();

    whenMontoLaPagina();

    thenLosCtasEnElDomSon(['Registrar institución', 'Iniciar sesión', 'Registrar institución']);
  }));

  it('dado un usuario no autenticado, cuando hago click en el CTA de login, deberia invocar AuthService.login a traves del presenter real', fakeAsync(() => {
    givenUsuarioNoAutenticado();
    whenMontoLaPagina();

    whenHagoClickEnElCtaDeLogin();

    expect(servicioAuth.login).toHaveBeenCalled();
  }));

  it('dado un token de invitacion pendiente, cuando se monta la pagina, deberia aceptar la invitacion y limpiar el token', fakeAsync(() => {
    givenUsuarioAutenticadoConRol('ALUMNO');
    givenTokenDeInvitacionPendiente('token-abc');
    servicioInvitaciones.aceptarInvitacion.and.resolveTo();

    whenMontoLaPagina();

    thenSeAceptoLaInvitacionCon('token-abc');
    thenElTokenFueLimpiado();
  }));

  it('dado un token de invitacion pendiente que falla, cuando se monta la pagina, deberia registrar el error de invitacion y limpiar el token de todas formas', fakeAsync(() => {
    givenUsuarioAutenticadoConRol('ALUMNO');
    givenTokenDeInvitacionPendiente('token-roto');
    servicioInvitaciones.aceptarInvitacion.and.rejectWith(new Error('error de red'));
    spyOn(console, 'error');

    whenMontoLaPagina();

    thenElErrorDeInvitacionFueRegistrado();
    thenElTokenFueLimpiado();
  }));

  it('dado un token de invitacion que falla y un perfil que tambien falla, cuando se monta la pagina, deberia mostrar el aviso de error en el DOM', fakeAsync(() => {
    givenAutenticadoConInvitacionYPerfilQuefallan();
    spyOn(console, 'error');

    whenMontoLaPagina();

    thenElAvisoDeErrorEsVisibleEnElDom();
  }));

  it('dado un usuario no autenticado, cuando hace click en el boton No tenes usuario, deberia abrir el modal en el DOM', fakeAsync(() => {
    givenUsuarioNoAutenticado();
    whenMontoLaPagina();

    whenHagoClickEnBotonNoTengoUsuario();

    thenElModalEsVisibleEnElDom();
  }));

  it('dado el modal abierto, cuando hace click en Cerrar, deberia cerrar el modal en el DOM', fakeAsync(() => {
    givenUsuarioNoAutenticado();
    whenMontoLaPagina();
    whenHagoClickEnBotonNoTengoUsuario();

    whenHagoClickEnCerrarModal();

    thenElModalNoEsVisibleEnElDom();
  }));

  function givenUsuarioNoAutenticado(): void {
    servicioAuth.isAutenticado.and.resolveTo(false);
  }

  function givenUsuarioAutenticadoConRol(rol: RolUsuario): void {
    servicioAuth.isAutenticado.and.resolveTo(true);
    servicioAuth.esperarAutenticacion.and.resolveTo(true);
    servicioPerfil.cargarPerfil.and.resolveTo(PerfilMother.crear({ rol }));
  }

  function givenAutenticadoConInvitacionYPerfilQuefallan(): void {
    servicioAuth.isAutenticado.and.resolveTo(true);
    servicioAuth.esperarAutenticacion.and.resolveTo(true);
    servicioTokenInvitacion.leer.and.returnValue('token-roto');
    servicioInvitaciones.aceptarInvitacion.and.rejectWith(new Error('error de red'));
    servicioPerfil.cargarPerfil.and.rejectWith(new Error('backend caido'));
  }

  function givenTokenDeInvitacionPendiente(token: string): void {
    servicioTokenInvitacion.leer.and.returnValue(token);
  }

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function whenHagoClickEnElCtaDeLogin(): void {
    const ctas = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.cta-stub'),
    );
    const ctaLogin = ctas.find((b) => b.textContent?.trim() === 'Iniciar sesión');
    ctaLogin?.click();
    tick();
  }

  function whenHagoClickEnBotonNoTengoUsuario(): void {
    const boton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.landing__leyenda-registro');
    boton?.click();
    fixture.detectChanges();
  }

  function whenHagoClickEnCerrarModal(): void {
    const botonCerrar = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.modal__acciones button');
    botonCerrar?.click();
    fixture.detectChanges();
  }

  function thenLosCtasEnElDomSon(textosEsperados: string[]): void {
    const ctas = (fixture.nativeElement as HTMLElement).querySelectorAll('.cta-stub');
    const textos = Array.from(ctas).map((b) => b.textContent?.trim());
    expect(ctas.length).toBe(textosEsperados.length);
    expect(textos).toEqual(textosEsperados);
  }

  function thenElAvisoDeErrorEsVisibleEnElDom(): void {
    const aviso = (fixture.nativeElement as HTMLElement).querySelector('.landing__aviso-error');
    expect(aviso).not.toBeNull();
    expect(aviso?.textContent).toContain('No pudimos asociar tu invitación');
  }

  function thenElModalEsVisibleEnElDom(): void {
    const overlay = (fixture.nativeElement as HTMLElement).querySelector('.modal__overlay');
    expect(overlay).not.toBeNull();
  }

  function thenElModalNoEsVisibleEnElDom(): void {
    const overlay = (fixture.nativeElement as HTMLElement).querySelector('.modal__overlay');
    expect(overlay).toBeNull();
  }

  function thenSeAceptoLaInvitacionCon(token: string): void {
    expect(servicioInvitaciones.aceptarInvitacion).toHaveBeenCalledWith(token);
  }

  function thenElTokenFueLimpiado(): void {
    expect(servicioTokenInvitacion.limpiar).toHaveBeenCalled();
  }

  function thenElErrorDeInvitacionFueRegistrado(): void {
    const page = component as unknown as { errorInvitacion: () => string | null };
    expect(page.errorInvitacion()).toContain('No pudimos asociar tu invitaci\u00f3n');
  }
});
