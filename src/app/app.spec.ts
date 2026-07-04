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

describe('App', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockPerfilService: Pick<PerfilService, 'rol'>;
  let mockNotificacionesService: jasmine.SpyObj<NotificacionesService>;
  let rolSignal: WritableSignal<RolUsuario | null>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAutenticado']);
    mockAuthService.isAutenticado.and.returnValue(Promise.resolve(false));

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['requestNotificationPermission']);
    mockNotificacionesService = jasmine.createSpyObj('NotificacionesService', ['obtenerNotificaciones']);
    rolSignal = signal<RolUsuario | null>(null);
    mockPerfilService = {
      rol: rolSignal.asReadonly(),
    };

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

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('dado un usuario NO autenticado, cuando inicializo, no deberia pedir permiso ni cargar notificaciones', async () => {
      const fixture = TestBed.createComponent(App);
      await fixture.componentInstance.ngOnInit();

      expect(mockNotificationService.requestNotificationPermission).not.toHaveBeenCalled();
      expect(mockNotificacionesService.obtenerNotificaciones).not.toHaveBeenCalled();
    });

    it('dado un usuario autenticado, cuando inicializo, deberia pedir permiso y traer notificaciones', async () => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
      const fixture = TestBed.createComponent(App);

      await fixture.componentInstance.ngOnInit();

      expect(mockNotificationService.requestNotificationPermission).toHaveBeenCalled();
      expect(mockNotificacionesService.obtenerNotificaciones).toHaveBeenCalled();
    });
  });

  describe('mostrarAsistente', () => {
    it('dado usuario autenticado con rol y no estar en / , mostrarAsistente deberia ser true', async () => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
      rolSignal.set('ALUMNO');
      const router = TestBed.inject(Router);
      const eventsSubject = new Subject<NavigationEnd>();
      Object.defineProperty(router, 'events', { get: () => eventsSubject.asObservable() });
      Object.defineProperty(router, 'url', { get: () => '/alumno' });

      const fixture = TestBed.createComponent(App);
      await fixture.componentInstance.ngOnInit();

      const componente = fixture.componentInstance as unknown as { mostrarAsistente(): boolean };
      expect(componente.mostrarAsistente()).toBeTrue();
    });

    it('dado un evento NavigationEnd a /seleccion-tipo-cuenta, mostrarAsistente deberia ser false', async () => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
      rolSignal.set('ALUMNO');
      const router = TestBed.inject(Router);
      const eventsSubject = new Subject<NavigationEnd>();
      Object.defineProperty(router, 'events', { get: () => eventsSubject.asObservable() });
      Object.defineProperty(router, 'url', { get: () => '/alumno' });

      const fixture = TestBed.createComponent(App);
      await fixture.componentInstance.ngOnInit();

      eventsSubject.next(new NavigationEnd(1, '/seleccion-tipo-cuenta', '/seleccion-tipo-cuenta'));

      const componente = fixture.componentInstance as unknown as { mostrarAsistente(): boolean };
      expect(componente.mostrarAsistente()).toBeFalse();
    });

    it('dado url con query y hash, normalizarUrl deberia devolver solo el path', () => {
      const fixture = TestBed.createComponent(App);
      const priv = fixture.componentInstance as unknown as { normalizarUrl(u: string): string };

      expect(priv.normalizarUrl('/alumno?tab=1#section')).toBe('/alumno');
    });

    it('dado un string vacio a normalizarUrl, deberia devolver "/"', () => {
      const fixture = TestBed.createComponent(App);
      const priv = fixture.componentInstance as unknown as { normalizarUrl(u: string): string };

      expect(priv.normalizarUrl('')).toBe('/');
    });
  });
});
