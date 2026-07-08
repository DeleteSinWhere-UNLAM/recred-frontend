import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { App } from './app';
import { AuthService } from './core/auth/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { PerfilService } from './data-access/services/perfil.service';
import { NotificacionesService } from './data-access/services/notificaciones.service';
import { RolUsuario } from './data-access/models/perfil.model';

interface PrivadoApp {
  mostrarAsistente(): boolean;
  normalizarUrl(u: string): string;
}

describe('App', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockPerfilService: Pick<PerfilService, 'rol'>;
  let mockNotificacionesService: jasmine.SpyObj<NotificacionesService>;
  let rolSignal: WritableSignal<RolUsuario | null>;
  let eventsSubject: Subject<NavigationEnd>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAutenticado']);
    givenUsuarioNoAutenticado();

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['requestNotificationPermission']);
    mockNotificacionesService = jasmine.createSpyObj('NotificacionesService', ['obtenerNotificaciones']);
    rolSignal = signal<RolUsuario | null>(null);
    mockPerfilService = { rol: rolSignal.asReadonly() };
    eventsSubject = new Subject<NavigationEnd>();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PerfilService, useValue: mockPerfilService },
        { provide: NotificacionesService, useValue: mockNotificacionesService },
      ],
    }).compileComponents();
  });

  it('dado el TestBed configurado, cuando creo el componente, deberia instanciarse correctamente', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('dado un usuario NO autenticado, cuando inicializo, no deberia pedir permiso ni cargar notificaciones', async () => {
      await whenInicializoLaApp();

      thenNoSePidioPermisoDeNotificaciones();
      thenNoSeCargaronNotificaciones();
    });

    it('dado un usuario autenticado, cuando inicializo, deberia pedir permiso y traer notificaciones', async () => {
      givenUsuarioAutenticado();

      await whenInicializoLaApp();

      thenSePidioPermisoDeNotificaciones();
      thenSeCargaronNotificaciones();
    });
  });

  describe('mostrarAsistente', () => {
    it('dado usuario autenticado con rol y no estar en /, mostrarAsistente deberia ser true', async () => {
      givenUsuarioAutenticado();
      givenRol('ALUMNO');
      givenRouterEnUrl('/alumno');

      const componente = await whenInicializoYObtengoPrivado();

      expect(componente.mostrarAsistente()).toBeTrue();
    });

    it('dado un evento NavigationEnd a /seleccion-tipo-cuenta, mostrarAsistente deberia ser false', async () => {
      givenUsuarioAutenticado();
      givenRol('ALUMNO');
      givenRouterEnUrl('/alumno');

      const componente = await whenInicializoYObtengoPrivado();
      whenSeNavegaA('/seleccion-tipo-cuenta');

      expect(componente.mostrarAsistente()).toBeFalse();
    });

    it('dado usuario autenticado con rol directivo, mostrarAsistente deberia ser false', async () => {
      givenUsuarioAutenticado();
      givenRol('DIRECTIVO_COLEGIO');
      givenRouterEnUrl('/directivo');

      const componente = await whenInicializoYObtengoPrivado();

      expect(componente.mostrarAsistente()).toBeFalse();
    });

    it('dado una url con query y hash, cuando normalizo, deberia devolver solo el path', () => {
      const priv = crearPrivadoSinInit();

      expect(priv.normalizarUrl('/alumno?tab=1#section')).toBe('/alumno');
    });

    it('dado un string vacio, cuando normalizo, deberia devolver "/"', () => {
      const priv = crearPrivadoSinInit();

      expect(priv.normalizarUrl('')).toBe('/');
    });
  });

  function givenUsuarioNoAutenticado(): void {
    mockAuthService.isAutenticado.and.returnValue(Promise.resolve(false));
  }

  function givenUsuarioAutenticado(): void {
    mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
  }

  function givenRol(rol: RolUsuario): void {
    rolSignal.set(rol);
  }

  function givenRouterEnUrl(url: string): void {
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'events', { get: () => eventsSubject.asObservable() });
    Object.defineProperty(router, 'url', { get: () => url });
  }

  async function whenInicializoLaApp(): Promise<void> {
    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.ngOnInit();
  }

  async function whenInicializoYObtengoPrivado(): Promise<PrivadoApp> {
    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.ngOnInit();
    return fixture.componentInstance as unknown as PrivadoApp;
  }

  function whenSeNavegaA(url: string): void {
    eventsSubject.next(new NavigationEnd(1, url, url));
  }

  function crearPrivadoSinInit(): PrivadoApp {
    const fixture = TestBed.createComponent(App);
    return fixture.componentInstance as unknown as PrivadoApp;
  }

  function thenSePidioPermisoDeNotificaciones(): void {
    expect(mockNotificationService.requestNotificationPermission).toHaveBeenCalled();
  }

  function thenNoSePidioPermisoDeNotificaciones(): void {
    expect(mockNotificationService.requestNotificationPermission).not.toHaveBeenCalled();
  }

  function thenSeCargaronNotificaciones(): void {
    expect(mockNotificacionesService.obtenerNotificaciones).toHaveBeenCalled();
  }

  function thenNoSeCargaronNotificaciones(): void {
    expect(mockNotificacionesService.obtenerNotificaciones).not.toHaveBeenCalled();
  }
});
