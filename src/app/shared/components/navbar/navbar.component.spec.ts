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
import { CompraService } from '../../../features/compra/services/compra.service';
import { AcreditarMercadoPagoService } from '../../../features/acreditar-mercado-pago/services/acreditar-mercado-pago.service';
import { ToastService } from '../../services/toast.service';
import { NavbarComponent } from './navbar.component';

interface NavbarProtegido {
  esPremium: () => boolean;
  planPagoLabel: () => string | null;
  cartCount: () => number;
  notifCount: () => number;
  menuAbierto: ReturnType<typeof signal<boolean>>;
  menuNotifAbierto: ReturnType<typeof signal<boolean>>;
  menuKiosqueroAbierto: ReturnType<typeof signal<boolean>>;
  menuBilleteraAbierto: ReturnType<typeof signal<boolean>>;
  menuMobileAbierto: ReturnType<typeof signal<boolean>>;
  toggleTema: () => void;
  irAlCarrito: () => void;
  irAMovimientos: () => void;
  irAInicio: (event: Event) => void;
  toggleMenu: () => void;
  toggleMenuMobile: () => void;
  toggleMenuBilletera: () => void;
  toggleNotificaciones: () => void;
  marcarTodasComoLeidas: () => void;
  clickEnNotificacion: (notif: Notificacion) => void;
  comprarSugerencia: (event: Event, notif: Notificacion) => Promise<void>;
  toggleMenuKiosquero: () => void;
  irARecomendacionesEstacionales: () => void;
  irAPanelControl: (event?: Event) => void;
  irAPanelTutor: (event?: Event) => void;
  irAPromociones: () => void;
  irAPerfil: () => void;
  irABilletera: () => void;
  irABilleteraDeHijo: (alumnoId: string) => void;
  irAPremium: () => void;
  irAAgregarHijo: () => void;
  cerrarSesion: () => Promise<void>;
  onDocumentClick: (event: MouseEvent) => void;
  onEscape: () => void;
  planBloqueado: (planRequerido: 'INTERMEDIO' | 'AVANZADO') => boolean;
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
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioCompra: jasmine.SpyObj<CompraService>;
  let servicioMercadoPago: jasmine.SpyObj<AcreditarMercadoPagoService>;
  let cartCountSignal: ReturnType<typeof signal<number>>;
  let esVistaAlumnoSignal: ReturnType<typeof signal<boolean>>;
  let esVistaKiosqueroSignal: ReturnType<typeof signal<boolean>>;
  let esVistaDirectivoSignal: ReturnType<typeof signal<boolean>>;
  let esVistaAdminSignal: ReturnType<typeof signal<boolean>>;
  let notificacionesSignal: ReturnType<typeof signal<Notificacion[]>>;
  let notifCantidadSignal: ReturnType<typeof signal<number>>;
  let alumnosSignal: ReturnType<typeof signal<ReturnType<typeof AlumnoMother.crear>[]>>;
  let temaSignal: ReturnType<typeof signal<'light' | 'dark'>>;
  let perfilSignal: jasmine.Spy;

  beforeEach(async () => {
    cartCountSignal = signal(0);
    esVistaAlumnoSignal = signal(false);
    esVistaKiosqueroSignal = signal(false);
    esVistaDirectivoSignal = signal(false);
    esVistaAdminSignal = signal(false);
    notificacionesSignal = signal<Notificacion[]>([]);
    notifCantidadSignal = signal(0);
    alumnosSignal = signal([AlumnoMother.crear({ id: 'alumno-1' })]);
    temaSignal = signal<'light' | 'dark'>('light');
    perfilSignal = jasmine.createSpy('perfil').and.returnValue(null);

    servicioAuth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    servicioAuth.logout.and.resolveTo();

    servicioCarrito = jasmine.createSpyObj<CarritoService>(
      'CarritoService',
      ['agregar'],
      { cantidadTotal: cartCountSignal.asReadonly() },
    );
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['homeUrl'], {
      esVistaAlumno: esVistaAlumnoSignal.asReadonly(),
      esVistaKiosquero: esVistaKiosqueroSignal.asReadonly(),
      esVistaDirectivo: esVistaDirectivoSignal.asReadonly(),
      esVistaAdmin: esVistaAdminSignal.asReadonly(),
    });
    servicioUsuario.homeUrl.and.returnValue('/tutor');
    servicioAlumnos = jasmine.createSpyObj<AlumnosService>(
      'AlumnosService',
      ['asegurarCargados', 'getAlumnoById'],
      { alumnos: alumnosSignal.asReadonly() },
    );
    servicioAlumnos.asegurarCargados.and.resolveTo([]);
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['perfil', 'rol']);
    (servicioPerfil.perfil as jasmine.Spy).and.callFake(() => perfilSignal());
    (servicioPerfil.rol as jasmine.Spy).and.callFake(() => perfilSignal()?.rol ?? null);
    servicioNotif = jasmine.createSpyObj<NotificacionesService>(
      'NotificacionesService',
      ['obtenerNotificaciones', 'marcarTodasComoLeidas', 'marcarComoLeida'],
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
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    servicioCompra = jasmine.createSpyObj<CompraService>('CompraService', ['setSugerenciaPendiente']);
    servicioMercadoPago = jasmine.createSpyObj<AcreditarMercadoPagoService>('AcreditarMercadoPagoService', ['generarLinkPago']);

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
        { provide: ToastService, useValue: servicioToast },
        { provide: CompraService, useValue: servicioCompra },
        { provide: AcreditarMercadoPagoService, useValue: servicioMercadoPago },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    interno = component as unknown as NavbarProtegido;
  });

  describe('planPagoLabel', () => {
    it('dado un perfil AVANZADO, deberia devolver Avanzado', () => {
      givenPerfil({ plan: 'AVANZADO' });

      expect(interno.planPagoLabel()).toBe('Avanzado');
      expect(interno.esPremium()).toBeTrue();
    });

    it('dado un perfil INTERMEDIO, deberia devolver Intermedio', () => {
      givenPerfil({ plan: 'INTERMEDIO' });

      expect(interno.planPagoLabel()).toBe('Intermedio');
      expect(interno.esPremium()).toBeTrue();
    });

    it('dado un perfil gratuito, no deberia mostrar label de plan pago', () => {
      givenPerfil({ plan: 'GRATUITO' });

      expect(interno.planPagoLabel()).toBeNull();
      expect(interno.esPremium()).toBeFalse();
    });

    it('dado sin perfil, no deberia mostrar label de plan pago', () => {
      givenPerfil(null);

      expect(interno.planPagoLabel()).toBeNull();
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

    it('dado plan avanzado, cuando llamo irARecomendacionesEstacionales, deberia cerrar el menu kiosquero y navegar', () => {
      givenPerfil({ plan: 'AVANZADO' });
      interno.menuKiosqueroAbierto.set(true);

      interno.irARecomendacionesEstacionales();

      expect(interno.menuKiosqueroAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/recomendaciones-estacionales');
    });

    it('dado plan intermedio, cuando llamo irARecomendacionesEstacionales, deberia mostrar bloqueo y no navegar', () => {
      givenPerfil({ plan: 'INTERMEDIO' });

      interno.irARecomendacionesEstacionales();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Disponible con plan Avanzado.', 'info');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/recomendaciones-estacionales');
    });

    it('dado plan gratuito, cuando llamo irAPanelControl, deberia mostrar bloqueo y no navegar', () => {
      givenPerfil({ plan: 'GRATUITO' });

      interno.irAPanelControl(new Event('click'));

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Disponible con plan Intermedio.', 'info');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/kiosquero/reportes');
    });

    it('dado plan intermedio, cuando llamo irAPanelControl, deberia navegar a reportes', () => {
      givenPerfil({ plan: 'INTERMEDIO' });

      interno.irAPanelControl(new Event('click'));

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/reportes');
    });

    it('dado plan gratuito, cuando llamo irAPanelTutor, deberia mostrar bloqueo y no navegar', () => {
      givenPerfil({ plan: 'GRATUITO' });

      interno.irAPanelTutor(new Event('click'));

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Disponible con plan Intermedio.', 'info');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/tutor-dashboard');
    });

    it('dado plan intermedio, cuando llamo irAPanelTutor, deberia navegar al panel tutor', () => {
      givenPerfil({ plan: 'INTERMEDIO' });

      interno.irAPanelTutor(new Event('click'));

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor-dashboard');
    });

    it('dado el navbar, cuando llamo irAPromociones, deberia cerrar el menu kiosquero y navegar', () => {
      givenPerfil({ plan: 'AVANZADO' });
      interno.menuKiosqueroAbierto.set(true);

      interno.irAPromociones();

      expect(interno.menuKiosqueroAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });

    it('dado plan intermedio, cuando llamo irAPromociones, deberia mostrar bloqueo y no navegar', () => {
      givenPerfil({ plan: 'INTERMEDIO' });

      interno.irAPromociones();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Disponible con plan Avanzado.', 'info');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/promociones');
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

    it('dado el menu mobile abierto, cuando aprieto escape, deberia cerrarlo', () => {
      interno.menuMobileAbierto.set(true);

      interno.onEscape();

      expect(interno.menuMobileAbierto()).toBeFalse();
    });
  });

  describe('toggleMenuMobile', () => {
    it('dado el menu mobile cerrado, cuando lo abro, deberia cerrar los otros menus', () => {
      interno.menuAbierto.set(true);
      interno.menuNotifAbierto.set(true);
      interno.menuKiosqueroAbierto.set(true);

      interno.toggleMenuMobile();

      expect(interno.menuMobileAbierto()).toBeTrue();
      expect(interno.menuAbierto()).toBeFalse();
      expect(interno.menuNotifAbierto()).toBeFalse();
      expect(interno.menuKiosqueroAbierto()).toBeFalse();
    });

    it('dado el menu mobile abierto, cuando lo cierro, no deberia tocar otros menus', () => {
      interno.toggleMenuMobile();
      interno.menuAbierto.set(true);

      interno.toggleMenuMobile();

      expect(interno.menuMobileAbierto()).toBeFalse();
      expect(interno.menuAbierto()).toBeTrue();
    });
  });

  describe('marcarTodasComoLeidas', () => {
    it('deberia delegar al servicio de notificaciones', () => {
      interno.marcarTodasComoLeidas();

      expect(servicioNotif.marcarTodasComoLeidas).toHaveBeenCalled();
    });
  });

  describe('irAAgregarHijo', () => {
    it('deberia cerrar los menus y navegar a /crear-hijo', () => {
      interno.menuAbierto.set(true);
      interno.menuBilleteraAbierto.set(true);

      interno.irAAgregarHijo();

      expect(interno.menuAbierto()).toBeFalse();
      expect(interno.menuBilleteraAbierto()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/crear-hijo');
    });
  });

  describe('clickEnNotificacion - vista tutor', () => {
    it('dado tipo ESTADO_COMPRA con alumnoId y compraId, deberia setear el contexto y navegar con id', () => {
      interno.clickEnNotificacion({ id: 'n1', tipo: 'ESTADO_COMPRA', alumnoId: 'a1', compraId: 'c1' });

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('a1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/movimientos?id=c1');
      expect(servicioNotif.marcarComoLeida).toHaveBeenCalledWith('n1');
    });

    it('dado tipo ESTADO_COMPRA sin alumnoId, deberia limpiar el contexto', () => {
      interno.clickEnNotificacion({ tipo: 'ESTADO_COMPRA' });

      expect(servicioContexto.limpiar).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/movimientos');
    });

    it('dado tipo SALDO_BAJO con alumnoId, deberia setear contexto y navegar a /billetera', () => {
      interno.clickEnNotificacion({ tipo: 'SALDO_BAJO', alumnoId: 'a1' });

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('a1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/billetera');
    });

    it('dado tipo ALERTA_PRESUPUESTO, deberia navegar a /presupuesto', () => {
      interno.clickEnNotificacion({ tipo: 'ALERTA_PRESUPUESTO', alumnoId: 'a1' });

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('a1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/presupuesto');
    });

    it('dado tipo ALERTA_RESTRICCION, deberia navegar a /restricciones-horarias', () => {
      interno.clickEnNotificacion({ tipo: 'ALERTA_RESTRICCION', alumnoId: 'a1' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/restricciones-horarias');
    });

    it('dado tipo SUGERENCIA_IA, deberia navegar a /preferencias-detectadas', () => {
      interno.clickEnNotificacion({ tipo: 'SUGERENCIA_IA' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/preferencias-detectadas');
    });

    it('dado tipo ALERTA_PRECIO, deberia navegar a /notificaciones-precio', () => {
      interno.clickEnNotificacion({ tipo: 'ALERTA_PRECIO' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/notificaciones-precio');
    });

    it('dado tipo AGREGAR_PRODUCTO, deberia navegar a /sugerencias-agregar', () => {
      interno.clickEnNotificacion({ tipo: 'AGREGAR_PRODUCTO' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/sugerencias-agregar');
    });

    it('dado vista alumno y tipo desconocido, deberia navegar al fallback /alumno', () => {
      esVistaAlumnoSignal.set(true);

      interno.clickEnNotificacion({ tipo: 'DESCONOCIDO' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/alumno');
    });
  });

  describe('clickEnNotificacion - vista kiosquero', () => {
    beforeEach(() => {
      givenPerfil({ rol: 'VENDEDOR' });
    });

    it('dado tipo ESTADO_COMPRA con compraId, deberia navegar a pedidos-tracking con id', () => {
      interno.clickEnNotificacion({ tipo: 'ESTADO_COMPRA', compraId: 'c1' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/pedidos-tracking?id=c1');
    });

    it('dado tipo ESTADO_COMPRA sin compraId, deberia navegar a pedidos-tracking sin id', () => {
      interno.clickEnNotificacion({ tipo: 'ESTADO_COMPRA' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/pedidos-tracking');
    });

    it('dado tipo AGREGAR_PRODUCTO, deberia navegar a /sugerencias-agregar', () => {
      interno.clickEnNotificacion({ tipo: 'AGREGAR_PRODUCTO' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/sugerencias-agregar');
    });

    it('dado tipo SISTEMA, deberia navegar a /admin-productos', () => {
      interno.clickEnNotificacion({ tipo: 'SISTEMA' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
    });

    it('dado tipo desconocido, deberia navegar a /kiosquero', () => {
      interno.clickEnNotificacion({ tipo: 'DESCONOCIDO' });

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  describe('comprarSugerencia', () => {
    const producto = { id: 'prod-1', nombre: 'Alfajor', precio: 500 } as unknown as NonNullable<Notificacion['producto']>;

    it('dado sin producto, no deberia hacer nada', async () => {
      await interno.comprarSugerencia(new Event('click'), {
        alumnoId: 'a1',
        sugerenciaId: 's1',
      });

      expect(servicioAlumnos.asegurarCargados).not.toHaveBeenCalled();
    });

    it('dado sin alumnoId, no deberia hacer nada', async () => {
      await interno.comprarSugerencia(new Event('click'), {
        producto,
        sugerenciaId: 's1',
      });

      expect(servicioAlumnos.asegurarCargados).not.toHaveBeenCalled();
    });

    it('dado alumno no encontrado, deberia mostrar toast de error y no agregar al carrito', async () => {
      servicioAlumnos.getAlumnoById.and.returnValue(undefined);

      await interno.comprarSugerencia(new Event('click'), {
        producto,
        alumnoId: 'a1',
        sugerenciaId: 's1',
      });

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No pudimos encontrar la información del alumno.',
        'error',
      );
      expect(servicioCarrito.agregar).not.toHaveBeenCalled();
    });

    it('dado saldo suficiente, deberia agregar al carrito, setear sugerencia y navegar a /compra', async () => {
      servicioAlumnos.getAlumnoById.and.returnValue({ id: 'a1', saldo: 1000 } as ReturnType<AlumnosService['getAlumnoById']>);
      spyOn(router, 'navigate').and.stub();

      await interno.comprarSugerencia(new Event('click'), {
        id: 'n1',
        producto,
        alumnoId: 'a1',
        sugerenciaId: 's1',
      });

      expect(servicioCarrito.agregar).toHaveBeenCalledWith(producto, 'a1', 1);
      expect(servicioCompra.setSugerenciaPendiente).toHaveBeenCalledWith('s1');
      expect(router.navigate).toHaveBeenCalledWith(['/compra']);
      expect(servicioNotif.marcarComoLeida).toHaveBeenCalledWith('n1');
    });

    it('dado saldo insuficiente, deberia mostrar toast con link de mercado pago', async () => {
      servicioAlumnos.getAlumnoById.and.returnValue({ id: 'a1', saldo: 100 } as ReturnType<AlumnosService['getAlumnoById']>);
      servicioMercadoPago.generarLinkPago.and.resolveTo('https://mp/link');

      await interno.comprarSugerencia(new Event('click'), {
        producto,
        alumnoId: 'a1',
        sugerenciaId: 's1',
      });

      expect(servicioMercadoPago.generarLinkPago).toHaveBeenCalledWith('a1', 500);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringContaining('Saldo insuficiente'),
        'error',
        8000,
      );
      expect(servicioCarrito.agregar).not.toHaveBeenCalled();
    });

    it('dado un error inesperado, deberia mostrar un toast generico', async () => {
      spyOn(console, 'error');
      servicioAlumnos.asegurarCargados.and.rejectWith(new Error('boom'));

      await interno.comprarSugerencia(new Event('click'), {
        producto,
        alumnoId: 'a1',
        sugerenciaId: 's1',
      });

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringContaining('Hubo un error'),
        'error',
      );
    });
  });

  function givenPerfil(perfil: unknown): void {
    perfilSignal.and.returnValue(perfil);
  }

});
