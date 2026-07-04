import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Hub } from 'aws-amplify/utils';
import { LandingPage } from './landing.page';
import { AuthService } from '../../core/auth/services/auth.service';
import {
  PerfilService,
  UsuarioSinPerfilError,
} from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { LandingCtaButtonComponent } from './components/landing-cta-button/landing-cta-button.component';
import { LandingPresenter } from './presenter/landing.presenter';
import { CtaLanding } from './models/cta-landing.model';
import { PerfilMother, AlumnoMother } from '../../data-access/services/alumno.mother';
import { RolUsuario } from '../../data-access/models/perfil.model';

type HubAuthPayload =
  | { event: 'signInWithRedirect' }
  | { event: 'signInWithRedirect_failure' }
  | { event: string };
type HubAuthCallback = (data: { payload: HubAuthPayload }) => void | Promise<void>;

@Component({
  selector: 'app-landing-cta-button',
  template: '',
  standalone: true,
})
class LandingCtaButtonStub {
  @Input() cta!: CtaLanding;
  @Output() clicked = new EventEmitter<void>();
}

interface PageProtegida {
  cargando(): boolean;
  onCtaClick(): void;
  onImagenError(evento: Event): void;
}

describe('LandingPage', () => {
  let fixture: ComponentFixture<LandingPage>;
  let component: LandingPage;
  let router: jasmine.SpyObj<Router>;
  let servicioAuth: jasmine.SpyObj<AuthService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let presenter: jasmine.SpyObj<LandingPresenter>;
  let hubCallback: HubAuthCallback | null;
  let hubUnsubscribeSpy: jasmine.Spy;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    servicioAuth = jasmine.createSpyObj('AuthService', ['isAutenticado', 'esperarAutenticacion']);
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['cargarHijosDelTutor']);
    presenter = jasmine.createSpyObj('LandingPresenter', ['iniciarLogin']);

    hubCallback = null;
    hubUnsubscribeSpy = jasmine.createSpy('hubUnsubscribe');
    spyOn(Hub, 'listen').and.callFake(((
      _channel: string,
      callback: HubAuthCallback,
    ) => {
      hubCallback = callback;
      return hubUnsubscribeSpy;
    }) as unknown as typeof Hub.listen);

    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: servicioAuth },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: AlumnosService, useValue: servicioAlumnos },
      ],
    })
      .overrideComponent(LandingPage, {
        remove: { imports: [LandingCtaButtonComponent] },
        add: {
          imports: [LandingCtaButtonStub],
          providers: [{ provide: LandingPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('Flujo de autenticación en ngOnInit', () => {
    it('dado un usuario no autenticado, cuando se monta la pagina, no deberia redirigir y deberia apagar el loader', fakeAsync(() => {
      givenUsuarioNoAutenticado();

      whenInicializoLaPagina();

      thenNoSeRedirigio();
      thenElLoaderEsta(false);
    }));

    it('dado un usuario autenticado con rol ALUMNO, cuando se monta la pagina, deberia redirigir a /alumno', fakeAsync(() => {
      givenUsuarioAutenticadoConRol('ALUMNO');

      whenInicializoLaPagina();

      thenSeRedirigioA('/alumno');
    }));

    it('dado un usuario autenticado con rol VENDEDOR, cuando se monta la pagina, deberia redirigir a /kiosquero', fakeAsync(() => {
      givenUsuarioAutenticadoConRol('VENDEDOR');

      whenInicializoLaPagina();

      thenSeRedirigioA('/kiosquero');
    }));

    it('dado un PADRE autenticado con hijos cargados, cuando se monta la pagina, deberia redirigir a /tutor', fakeAsync(() => {
      givenPadreAutenticadoConHijos([AlumnoMother.crearHijoDelTutor()]);

      whenInicializoLaPagina();

      thenSeRedirigioA('/tutor');
    }));

    it('dado un PADRE autenticado sin hijos, cuando se monta la pagina, deberia redirigir a /crear-hijo', fakeAsync(() => {
      givenPadreAutenticadoConHijos([]);

      whenInicializoLaPagina();

      thenSeRedirigioA('/crear-hijo');
    }));

    it('dado un usuario autenticado sin perfil, cuando se monta la pagina, deberia redirigir a /seleccion-tipo-cuenta', fakeAsync(() => {
      givenUsuarioAutenticadoSinPerfil();

      whenInicializoLaPagina();

      thenSeRedirigioA('/seleccion-tipo-cuenta');
    }));

    it('dado que cargarPerfil falla con un error generico, cuando se monta la pagina, no deberia redirigir y deberia apagar el loader', fakeAsync(() => {
      servicioAuth.isAutenticado.and.resolveTo(true);
      servicioAuth.esperarAutenticacion.and.resolveTo(true);
      servicioPerfil.cargarPerfil.and.rejectWith(new Error('backend caido'));
      spyOn(console, 'error');

      whenInicializoLaPagina();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      thenElLoaderEsta(false);
      expect(console.error).toHaveBeenCalledWith('Error cargando perfil tras login', jasmine.any(Error));
    }));

    it('dado un PADRE cuyo listado de hijos falla, cuando se monta la pagina, deberia redirigir a /tutor por defecto', fakeAsync(() => {
      servicioAuth.isAutenticado.and.resolveTo(true);
      servicioAuth.esperarAutenticacion.and.resolveTo(true);
      servicioPerfil.cargarPerfil.and.resolveTo(PerfilMother.crearTutor());
      servicioAlumnos.cargarHijosDelTutor.and.rejectWith(new Error('sin conexion'));
      spyOn(console, 'error');

      whenInicializoLaPagina();

      thenSeRedirigioA('/tutor');
      expect(console.error).toHaveBeenCalledWith('Error verificando hijos del tutor', jasmine.any(Error));
    }));

    it('dado un usuario autenticado pero cuya espera de autenticacion falla, cuando se monta la pagina, no deberia redirigir', fakeAsync(() => {
      servicioAuth.isAutenticado.and.resolveTo(true);
      servicioAuth.esperarAutenticacion.and.resolveTo(false);

      whenInicializoLaPagina();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      thenElLoaderEsta(false);
    }));
  });

  describe('Hub de amplify', () => {
    it('dado un evento signInWithRedirect luego de montar sin sesion, cuando el hub lo emite, deberia continuar el login autenticado', fakeAsync(() => {
      givenUsuarioNoAutenticado();
      whenInicializoLaPagina();
      servicioAuth.esperarAutenticacion.and.resolveTo(true);
      servicioPerfil.cargarPerfil.and.resolveTo(PerfilMother.crear({ rol: 'VENDEDOR' }));

      whenHubEmite('signInWithRedirect');

      thenSeRedirigioA('/kiosquero');
    }));

    it('dado un evento signInWithRedirect_failure luego de montar sin sesion, cuando el hub lo emite, deberia apagar el loader', fakeAsync(() => {
      givenUsuarioNoAutenticado();
      whenInicializoLaPagina();

      whenHubEmite('signInWithRedirect_failure');

      thenElLoaderEsta(false);
    }));

    it('dado un evento ajeno al flujo, cuando el hub lo emite, no deberia disparar navegacion', fakeAsync(() => {
      givenUsuarioNoAutenticado();
      whenInicializoLaPagina();

      whenHubEmite('signedOut');

      expect(router.navigateByUrl).not.toHaveBeenCalled();
    }));

    it('dado un login autenticado ya redirigiendo, cuando llega otro signInWithRedirect, no deberia redirigir de nuevo', fakeAsync(() => {
      givenUsuarioAutenticadoConRol('ALUMNO');
      whenInicializoLaPagina();
      router.navigateByUrl.calls.reset();

      whenHubEmite('signInWithRedirect');

      expect(router.navigateByUrl).not.toHaveBeenCalled();
    }));

    it('dado que la pagina se destruye, deberia desuscribirse del hub', () => {
      givenUsuarioNoAutenticado();
      fixture.detectChanges();

      component.ngOnDestroy();

      expect(hubUnsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Interacciones del usuario y template', () => {
    it('dado el cta clickeado, cuando llamo a onCtaClick, deberia delegar al presenter', () => {
      givenUsuarioNoAutenticado();
      fixture.detectChanges();

      whenClickEnElCta();

      expect(presenter.iniciarLogin).toHaveBeenCalled();
    });

    it('dada una imagen que falla y no es el fallback, cuando se dispara el error, deberia asignar la imagen fallback', () => {
      givenUsuarioNoAutenticado();
      fixture.detectChanges();
      const imagen = unaImagenQueFalla('http://error.com/img.jpg');

      whenLaImagenFalla(imagen);

      thenLaImagenEsElFallback(imagen);
    });

    it('dada una imagen que ya es el fallback, cuando vuelve a fallar, no deberia reasignar el src', () => {
      givenUsuarioNoAutenticado();
      fixture.detectChanges();
      const imagen = document.createElement('img');
      const evento = { target: imagen } as unknown as Event;
      (component as unknown as PageProtegida).onImagenError(evento);
      const setSrcSpy = spyOnProperty(imagen, 'src', 'set');

      (component as unknown as PageProtegida).onImagenError(evento);

      expect(setSrcSpy).not.toHaveBeenCalled();
    });
  });

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

  function givenUsuarioAutenticadoSinPerfil(): void {
    servicioAuth.isAutenticado.and.resolveTo(true);
    servicioAuth.esperarAutenticacion.and.resolveTo(true);
    servicioPerfil.cargarPerfil.and.rejectWith(new UsuarioSinPerfilError());
  }

  function unaImagenQueFalla(src: string): HTMLImageElement {
    const imagen = document.createElement('img');
    imagen.src = src;
    return imagen;
  }

  function whenInicializoLaPagina(): void {
    fixture.detectChanges();
    tick();
  }

  function whenClickEnElCta(): void {
    (component as unknown as PageProtegida).onCtaClick();
  }

  function whenLaImagenFalla(imagen: HTMLImageElement): void {
    (component as unknown as PageProtegida).onImagenError({ target: imagen } as unknown as Event);
  }

  function whenHubEmite(event: string): void {
    hubCallback?.({ payload: { event } });
    tick();
  }

  function thenNoSeRedirigio(): void {
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  }

  function thenSeRedirigioA(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }

  function thenElLoaderEsta(esperado: boolean): void {
    expect((component as unknown as PageProtegida).cargando()).toBe(esperado);
  }

  function thenLaImagenEsElFallback(imagen: HTMLImageElement): void {
    expect(imagen.src).toContain('data:image/svg+xml');
  }
});
