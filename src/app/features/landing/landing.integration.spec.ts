import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { LandingPage } from './landing.page';
import { LandingCtaButtonComponent } from './components/landing-cta-button/landing-cta-button.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { InvitacionTokenStorageService } from '../aceptar-invitacion-tutor/services/invitacion-token-storage.service';
import { InvitacionesTutorService } from '../directivo/services/invitaciones-tutor.service';
import { CtaLanding } from './models/cta-landing.model';
import { PerfilMother, AlumnoMother } from '../../data-access/services/alumno.mother';
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
  let router: jasmine.SpyObj<Router>;
  let servicioAuth: jasmine.SpyObj<AuthService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioTokenInvitacion: jasmine.SpyObj<InvitacionTokenStorageService>;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
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
        { provide: Router, useValue: router },
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
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('dado un usuario no autenticado, cuando se monta la pagina, deberia renderizar los dos CTAs en el DOM', fakeAsync(() => {
    givenUsuarioNoAutenticado();

    whenMontoLaPagina();

    thenLosCtasEnElDomSon(['Iniciar sesión', 'Registrarme']);
  }));

  it('dado un usuario no autenticado, cuando hago click en un CTA, deberia invocar AuthService.login a traves del presenter real', fakeAsync(() => {
    givenUsuarioNoAutenticado();
    whenMontoLaPagina();

    whenHagoClickEnElPrimerCta();

    expect(servicioAuth.login).toHaveBeenCalled();
  }));

  it('dado un usuario autenticado con rol ALUMNO, cuando se monta la pagina, deberia redirigir a /alumno', fakeAsync(() => {
    givenUsuarioAutenticadoConRol('ALUMNO');

    whenMontoLaPagina();

    thenSeRedirigioA('/alumno');
  }));

  it('dado un PADRE autenticado sin hijos, cuando se monta la pagina, deberia redirigir a /crear-hijo', fakeAsync(() => {
    givenPadreAutenticadoConHijos([]);

    whenMontoLaPagina();

    thenSeRedirigioA('/crear-hijo');
  }));

  it('dado un PADRE autenticado con hijos, cuando se monta la pagina, deberia redirigir a /tutor', fakeAsync(() => {
    givenPadreAutenticadoConHijos([AlumnoMother.crearHijoDelTutor()]);

    whenMontoLaPagina();

    thenSeRedirigioA('/tutor');
  }));

  function givenUsuarioNoAutenticado(): void {
    servicioAuth.isAutenticado.and.resolveTo(false);
  }

  function givenUsuarioAutenticadoConRol(rol: RolUsuario): void {
    servicioAuth.isAutenticado.and.resolveTo(true);
    servicioAuth.esperarAutenticacion.and.resolveTo(true);
    servicioPerfil.cargarPerfil.and.resolveTo(PerfilMother.crear({ rol }));
  }

  function givenPadreAutenticadoConHijos(hijos: ReturnType<typeof AlumnoMother.crearHijoDelTutor>[]): void {
    servicioAuth.isAutenticado.and.resolveTo(true);
    servicioAuth.esperarAutenticacion.and.resolveTo(true);
    servicioPerfil.cargarPerfil.and.resolveTo(PerfilMother.crearTutor());
    servicioAlumnos.cargarHijosDelTutor.and.resolveTo(hijos);
  }

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function whenHagoClickEnElPrimerCta(): void {
    const primerCta = (fixture.nativeElement as HTMLElement).querySelector('.cta-stub') as HTMLButtonElement;
    primerCta.click();
    tick();
  }

  function thenLosCtasEnElDomSon(textosEsperados: string[]): void {
    const ctas = (fixture.nativeElement as HTMLElement).querySelectorAll('.cta-stub');
    const textos = Array.from(ctas).map((b) => b.textContent?.trim());
    expect(ctas.length).toBe(textosEsperados.length);
    expect(textos).toEqual(textosEsperados);
  }

  function thenSeRedirigioA(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }
});
