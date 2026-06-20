import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LandingPage } from './landing.page';
import { AuthService } from '../../core/auth/services/auth.service';
import { PerfilService, UsuarioSinPerfilError } from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { LandingPresenter } from './presenter/landing.presenter';

describe('LandingPage', () => {
  let componente: LandingPage;
  let fixture: ComponentFixture<LandingPage>;

  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockPerfilService: jasmine.SpyObj<PerfilService>;
  let mockAlumnosService: jasmine.SpyObj<AlumnosService>;
  let mockPresenter: jasmine.SpyObj<LandingPresenter>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAutenticado', 'esperarAutenticacion']);
    mockPerfilService = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    mockAlumnosService = jasmine.createSpyObj('AlumnosService', ['cargarHijosDelTutor']);
    mockPresenter = jasmine.createSpyObj('LandingPresenter', ['iniciarLogin']);

    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PerfilService, useValue: mockPerfilService },
        { provide: AlumnosService, useValue: mockAlumnosService }
      ]
    })
    .overrideComponent(LandingPage, {
      set: {
        providers: [{ provide: LandingPresenter, useValue: mockPresenter }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    componente = fixture.componentInstance;
  });

  afterEach(() => {
    // Para limpiar la suscripción al Hub
    componente.ngOnDestroy();
  });

  describe('Flujo de autenticación en ngOnInit', () => {
    it('dado que el usuario NO esta autenticado, debe terminar y no redirigir', fakeAsync(() => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(false));

      fixture.detectChanges();
      tick();

      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
      // Podemos acceder al signal usando su getter publico as any o leyendo la vista. 
      // Como cargando es protected, casteamos para verificar.
      expect((componente as any).cargando()).toBeFalse();
    }));

    it('dado que el usuario esta autenticado y tiene rol ALUMNO, debe redirigir a /alumno', fakeAsync(() => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
      mockAuthService.esperarAutenticacion.and.returnValue(Promise.resolve(true));
      mockPerfilService.cargarPerfil.and.returnValue(Promise.resolve({ rol: 'ALUMNO' } as any));

      fixture.detectChanges();
      tick();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/alumno');
    }));

    it('dado que el usuario esta autenticado y tiene rol VENDEDOR, debe redirigir a /kiosquero', fakeAsync(() => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
      mockAuthService.esperarAutenticacion.and.returnValue(Promise.resolve(true));
      mockPerfilService.cargarPerfil.and.returnValue(Promise.resolve({ rol: 'VENDEDOR' } as any));

      fixture.detectChanges();
      tick();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    }));

    it('dado que es PADRE y TIENE hijos, debe redirigir a /tutor', fakeAsync(() => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
      mockAuthService.esperarAutenticacion.and.returnValue(Promise.resolve(true));
      mockPerfilService.cargarPerfil.and.returnValue(Promise.resolve({ rol: 'PADRE' } as any));
      mockAlumnosService.cargarHijosDelTutor.and.returnValue(Promise.resolve([{} as any]));

      fixture.detectChanges();
      tick();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/tutor');
    }));

    it('dado que es PADRE y NO tiene hijos, debe redirigir a /crear-hijo', fakeAsync(() => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
      mockAuthService.esperarAutenticacion.and.returnValue(Promise.resolve(true));
      mockPerfilService.cargarPerfil.and.returnValue(Promise.resolve({ rol: 'PADRE' } as any));
      mockAlumnosService.cargarHijosDelTutor.and.returnValue(Promise.resolve([]));

      fixture.detectChanges();
      tick();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/crear-hijo');
    }));

    it('dado que la cuenta no tiene perfil creado, debe redirigir a /seleccion-tipo-cuenta', fakeAsync(() => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(true));
      mockAuthService.esperarAutenticacion.and.returnValue(Promise.resolve(true));
      mockPerfilService.cargarPerfil.and.returnValue(Promise.reject(new UsuarioSinPerfilError()));

      fixture.detectChanges();
      tick();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/seleccion-tipo-cuenta');
    }));
  });

  describe('Interacciones de usuario y template', () => {
    it('dado que se hace click en el CTA, debe llamar al presenter', () => {
      // Evitamos asincronia
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(false));
      fixture.detectChanges();

      (componente as any).onCtaClick();

      expect(mockPresenter.iniciarLogin).toHaveBeenCalled();
    });

    it('dado que ocurre un error de imagen, debe asignar el fallback si es distinta', () => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(false));
      fixture.detectChanges();

      const imgEl = document.createElement('img');
      imgEl.src = 'http://error.com/img.jpg';
      const event = { target: imgEl } as unknown as Event;

      (componente as any).onImagenError(event);

      expect(imgEl.src).toContain('data:image/svg+xml');
    });

    it('dado que la imagen que falla ya es el fallback, no debe hacer nada infinito', () => {
      mockAuthService.isAutenticado.and.returnValue(Promise.resolve(false));
      fixture.detectChanges();

      const imgEl = document.createElement('img');
      const event = { target: imgEl } as unknown as Event;
      
      // Primera llamada para asignar el fallback
      (componente as any).onImagenError(event);
      
      const setSpy = spyOnProperty(imgEl, 'src', 'set');

      // Segunda llamada
      (componente as any).onImagenError(event);

      expect(setSpy).not.toHaveBeenCalled();
    });
  });
});
