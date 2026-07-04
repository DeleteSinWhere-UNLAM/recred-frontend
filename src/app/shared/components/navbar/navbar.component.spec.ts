import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { Notificacion, NotificacionesService } from '../../../data-access/services/notificaciones.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { CarritoService } from '../../../features/compra/services/carrito.service';
import { NavbarComponent } from './navbar.component';

interface NavbarProtegido {
  esPremium: () => boolean;
  cartCount: () => number;
  notifCount: () => number;
  menuAbierto: ReturnType<typeof signal<boolean>>;
  menuNotifAbierto: ReturnType<typeof signal<boolean>>;
  menuKiosqueroAbierto: ReturnType<typeof signal<boolean>>;
  menuBilleteraAbierto: ReturnType<typeof signal<boolean>>;
  toggleTema: () => void;
  irAlCarrito: () => void;
  irAMovimientos: () => void;
  irAInicio: (event: Event) => void;
  toggleMenu: () => void;
  toggleMenuBilletera: () => void;
  toggleNotificaciones: () => void;
  clickEnNotificacion: (notif: Notificacion) => void;
  toggleMenuKiosquero: () => void;
  irARecomendacionesEstacionales: () => void;
  irAPromociones: () => void;
  irAPerfil: () => void;
  irABilletera: () => void;
  irABilleteraDeHijo: (alumnoId: string) => void;
  irAPremium: () => void;
  cerrarSesion: () => Promise<void>;
  onDocumentClick: (event: MouseEvent) => void;
  onEscape: () => void;
}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let interno: NavbarProtegido;
  let router: Router;
  let servicioAuth: jasmine.SpyObj<AuthService>;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioNotif: jasmine.SpyObj<NotificacionesService>;
  let servicioTheme: jasmine.SpyObj<ThemeService>;
  let servicioContexto: jasmine.SpyObj<AlumnoContextoService>;
  let cartCountSignal: ReturnType<typeof signal<number>>;
  let esVistaAlumnoSignal: ReturnType<typeof signal<boolean>>;
  let esVistaKiosqueroSignal: ReturnType<typeof signal<boolean>>;
  let notificacionesSignal: ReturnType<typeof signal<Notificacion[]>>;
  let notifCantidadSignal: ReturnType<typeof signal<number>>;
  let alumnosSignal: ReturnType<typeof signal<ReturnType<typeof AlumnoMother.crear>[]>>;
  let temaSignal: ReturnType<typeof signal<'light' | 'dark'>>;
  let perfilSignal: jasmine.Spy;

  beforeEach(async () => {
    cartCountSignal = signal(0);
    esVistaAlumnoSignal = signal(false);
    esVistaKiosqueroSignal = signal(false);
    notificacionesSignal = signal<Notificacion[]>([]);
    notifCantidadSignal = signal(0);
    alumnosSignal = signal([AlumnoMother.crear({ id: 'alumno-1' })]);
    temaSignal = signal<'light' | 'dark'>('light');
    perfilSignal = jasmine.createSpy('perfil').and.returnValue(null);

    servicioAuth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    servicioAuth.logout.and.resolveTo();

    servicioCarrito = jasmine.createSpyObj<CarritoService>(
      'CarritoService',
      [],
      { cantidadTotal: cartCountSignal.asReadonly() },
    );
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['homeUrl'], {
      esVistaAlumno: esVistaAlumnoSignal.asReadonly(),
      esVistaKiosquero: esVistaKiosqueroSignal.asReadonly(),
    });
    servicioUsuario.homeUrl.and.returnValue('/tutor');
    servicioAlumnos = jasmine.createSpyObj<AlumnosService>(
      'AlumnosService',
      ['asegurarCargados'],
      { alumnos: alumnosSignal.asReadonly() },
    );
    servicioAlumnos.asegurarCargados.and.resolveTo([]);
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['perfil', 'rol']);
    (servicioPerfil.perfil as jasmine.Spy).and.callFake(() => perfilSignal());
    (servicioPerfil.rol as jasmine.Spy).and.callFake(() => perfilSignal()?.rol ?? null);
    servicioNotif = jasmine.createSpyObj<NotificacionesService>(
      'NotificacionesService',
      ['obtenerNotificaciones'],
      {
        notificaciones: notificacionesSignal.asReadonly(),
        cantidad: notifCantidadSignal.asReadonly(),
      },
    );
    servicioTheme = jasmine.createSpyObj<ThemeService>('ThemeService', ['toggleTheme'], {
      theme: temaSignal,
    });
    servicioContexto = jasmine.createSpyObj<AlumnoContextoService>('AlumnoContextoService', [
      'setAlumnoId',
      'limpiar',
    ]);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: servicioAuth },
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: NotificacionesService, useValue: servicioNotif },
        { provide: ThemeService, useValue: servicioTheme },
        { provide: AlumnoContextoService, useValue: servicioContexto },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    interno = component as unknown as NavbarProtegido;
  });

  describe('esPremium', () => {
    it('dado un perfil PREMIUM, esPremium deberia ser true', () => {
      perfilSignal.and.returnValue({ plan: 'PREMIUM' });

      expect(interno.esPremium()).toBeTrue();
    });

    it('dado un perfil AVANZADO, esPremium deberia ser true', () => {
      perfilSignal.and.returnValue({ plan: 'AVANZADO' });

      expect(interno.esPremium()).toBeTrue();
    });

    it('dado un perfil basico, esPremium deberia ser false', () => {
      perfilSignal.and.returnValue({ plan: 'GRATIS' });

      expect(interno.esPremium()).toBeFalse();
    });

    it('dado sin perfil, esPremium deberia ser false', () => {
      perfilSignal.and.returnValue(null);

      expect(interno.esPremium()).toBeFalse();
    });
  });

  describe('navegacion', () => {
    it('dado el navbar, cuando llamo irAlCarrito, deberia navegar a /compra', () => {
      interno.irAlCarrito();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/compra');
    });

    it('dado el navbar, cuando llamo irAMovimientos, deberia limpiar el contexto y navegar a /movimientos', () => {
      interno.irAMovimientos();

      expect(servicioContexto.limpiar).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/movimientos');
    });

    it('dado el navbar, cuando llamo irAInicio, deberia hacer preventDefault y navegar al homeUrl', () => {
      const event = new Event('click');
      const preventDefaultSpy = spyOn(event, 'preventDefault');

      interno.irAInicio(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });

    it('dado el navbar, cuando llamo irAPerfil, deberia cerrar el menu y navegar a /perfil', () => {
      interno.menuAbierto.set(true);

      interno.irAPerfil();

      expect(interno.menuAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/perfil');
    });

    it('dado el navbar, cuando llamo irABilletera, deberia cerrar menu y menuBilletera y navegar a /billetera', () => {
      interno.menuAbierto.set(true);
      interno.menuBilleteraAbierto.set(true);

      interno.irABilletera();

      expect(interno.menuAbierto()).toBeFalse();
      expect(interno.menuBilleteraAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/billetera');
    });

    it('dado un alumnoId, cuando llamo irABilleteraDeHijo, deberia setear el contexto y navegar a /billetera', () => {
      interno.irABilleteraDeHijo('alumno-1');

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/billetera');
    });

    it('dado el navbar, cuando llamo irAPremium, deberia cerrar el menu y navegar a /suscripcion', () => {
      interno.menuAbierto.set(true);

      interno.irAPremium();

      expect(interno.menuAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/suscripcion');
    });

    it('dado el navbar, cuando llamo irARecomendacionesEstacionales, deberia cerrar el menu kiosquero y navegar', () => {
      interno.menuKiosqueroAbierto.set(true);

      interno.irARecomendacionesEstacionales();

      expect(interno.menuKiosqueroAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/recomendaciones-estacionales');
    });

    it('dado el navbar, cuando llamo irAPromociones, deberia cerrar el menu kiosquero y navegar', () => {
      interno.menuKiosqueroAbierto.set(true);

      interno.irAPromociones();

      expect(interno.menuKiosqueroAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });
  });

  describe('toggleMenu', () => {
    it('dado el menu cerrado, cuando hago toggle, deberia abrirlo y cerrar notif/kiosquero', () => {
      interno.menuNotifAbierto.set(true);
      interno.menuKiosqueroAbierto.set(true);

      interno.toggleMenu();

      expect(interno.menuAbierto()).toBeTrue();
      expect(interno.menuNotifAbierto()).toBeFalse();
      expect(interno.menuKiosqueroAbierto()).toBeFalse();
    });

    it('dado el menu abierto, cuando hago toggle, deberia cerrarlo y cerrar el menu billetera tambien', () => {
      interno.toggleMenu();
      interno.menuBilleteraAbierto.set(true);

      interno.toggleMenu();

      expect(interno.menuAbierto()).toBeFalse();
      expect(interno.menuBilleteraAbierto()).toBeFalse();
    });
  });

  describe('toggleMenuBilletera', () => {
    it('dado sin alumnos cargados, cuando abro el menu billetera, deberia pedir asegurarCargados', () => {
      alumnosSignal.set([]);

      interno.toggleMenuBilletera();

      expect(interno.menuBilleteraAbierto()).toBeTrue();
      expect(servicioAlumnos.asegurarCargados).toHaveBeenCalled();
    });

    it('dado alumnos ya cargados, cuando abro el menu billetera, no deberia llamar asegurarCargados', () => {
      interno.toggleMenuBilletera();

      expect(interno.menuBilleteraAbierto()).toBeTrue();
      expect(servicioAlumnos.asegurarCargados).not.toHaveBeenCalled();
    });

    it('dado el menu billetera abierto, cuando hago toggle, deberia cerrarlo', () => {
      interno.toggleMenuBilletera();

      interno.toggleMenuBilletera();

      expect(interno.menuBilleteraAbierto()).toBeFalse();
    });
  });

  describe('toggleNotificaciones', () => {
    it('dado el menu notif cerrado, cuando abro, deberia cerrar los demas menus y pedir notificaciones', () => {
      interno.menuAbierto.set(true);
      interno.menuKiosqueroAbierto.set(true);

      interno.toggleNotificaciones();

      expect(interno.menuNotifAbierto()).toBeTrue();
      expect(interno.menuAbierto()).toBeFalse();
      expect(interno.menuKiosqueroAbierto()).toBeFalse();
      expect(servicioNotif.obtenerNotificaciones).toHaveBeenCalled();
    });

    it('dado el menu notif abierto, cuando cierro, no deberia pedir notificaciones', () => {
      interno.toggleNotificaciones();
      servicioNotif.obtenerNotificaciones.calls.reset();

      interno.toggleNotificaciones();

      expect(interno.menuNotifAbierto()).toBeFalse();
      expect(servicioNotif.obtenerNotificaciones).not.toHaveBeenCalled();
    });
  });

  describe('clickEnNotificacion', () => {
    it('dado una notif tipo RESUMEN_SEMANAL, cuando la clickeo, deberia cerrar el menu y navegar a /resumen-semanal', () => {
      interno.menuNotifAbierto.set(true);

      interno.clickEnNotificacion({ tipo: 'RESUMEN_SEMANAL' });

      expect(interno.menuNotifAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/resumen-semanal');
    });

    it('dado una notif de otro tipo en vista tutor, deberia cerrar el menu y navegar al fallback /tutor-dashboard', () => {
      interno.menuNotifAbierto.set(true);

      interno.clickEnNotificacion({ tipo: 'OTRO' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor-dashboard');
      expect(interno.menuNotifAbierto()).toBeFalse();
    });
  });

  describe('toggleMenuKiosquero', () => {
    it('dado el menu kiosquero cerrado, cuando abro, deberia cerrar los otros menus', () => {
      interno.menuAbierto.set(true);
      interno.menuNotifAbierto.set(true);

      interno.toggleMenuKiosquero();

      expect(interno.menuKiosqueroAbierto()).toBeTrue();
      expect(interno.menuAbierto()).toBeFalse();
      expect(interno.menuNotifAbierto()).toBeFalse();
    });

    it('dado el menu kiosquero abierto, cuando cierro, no deberia tocar otros menus', () => {
      interno.toggleMenuKiosquero();
      interno.menuAbierto.set(true);

      interno.toggleMenuKiosquero();

      expect(interno.menuKiosqueroAbierto()).toBeFalse();
      expect(interno.menuAbierto()).toBeTrue();
    });
  });

  describe('cerrarSesion', () => {
    it('dado el logout exitoso, deberia cerrar el menu, llamar logout y navegar a /', async () => {
      interno.menuAbierto.set(true);

      await interno.cerrarSesion();

      expect(interno.menuAbierto()).toBeFalse();
      expect(servicioAuth.logout).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('dado que el logout falla, deberia igual navegar a / y no romper', async () => {
      spyOn(console, 'error');
      servicioAuth.logout.and.rejectWith(new Error('boom'));

      await interno.cerrarSesion();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });
  });

  describe('toggleTema', () => {
    it('dado el navbar, cuando llamo toggleTema, deberia delegar al ThemeService', () => {
      interno.toggleTema();

      expect(servicioTheme.toggleTheme).toHaveBeenCalled();
    });
  });

  describe('onDocumentClick', () => {
    it('dado ningun menu abierto, no deberia hacer nada al click fuera', () => {
      const target = document.createElement('div');
      document.body.appendChild(target);
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: target });

      interno.onDocumentClick(event);

      expect(interno.menuAbierto()).toBeFalse();
      document.body.removeChild(target);
    });

    it('dado un menu abierto y click fuera del host, deberia cerrar todos los menus', () => {
      interno.menuAbierto.set(true);
      interno.menuNotifAbierto.set(true);
      const target = document.createElement('div');
      document.body.appendChild(target);
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: target });

      interno.onDocumentClick(event);

      expect(interno.menuAbierto()).toBeFalse();
      expect(interno.menuNotifAbierto()).toBeFalse();
      document.body.removeChild(target);
    });

    it('dado un menu abierto y click dentro del host, no deberia cerrar los menus', () => {
      fixture.detectChanges();
      interno.menuAbierto.set(true);
      const target = (fixture.nativeElement as HTMLElement).querySelector('*') as HTMLElement | null;
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: target ?? fixture.nativeElement });

      interno.onDocumentClick(event);

      expect(interno.menuAbierto()).toBeTrue();
    });
  });

  describe('onEscape', () => {
    it('dado los menus abiertos, cuando aprieto escape, deberia cerrar todos', () => {
      interno.menuAbierto.set(true);
      interno.menuNotifAbierto.set(true);
      interno.menuKiosqueroAbierto.set(true);
      interno.menuBilleteraAbierto.set(true);

      interno.onEscape();

      expect(interno.menuAbierto()).toBeFalse();
      expect(interno.menuNotifAbierto()).toBeFalse();
      expect(interno.menuKiosqueroAbierto()).toBeFalse();
      expect(interno.menuBilleteraAbierto()).toBeFalse();
    });

    it('dado sin menus abiertos, cuando aprieto escape, deberia no cambiar nada', () => {
      interno.onEscape();

      expect(interno.menuAbierto()).toBeFalse();
    });
  });
});
