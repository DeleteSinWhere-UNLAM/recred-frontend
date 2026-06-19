import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../../core/auth/services/auth.service';
import { CarritoService } from '../../../features/compra/services/carrito.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { NotificacionesService } from '../../../data-access/services/notificaciones.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { provideRouter } from '@angular/router';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  
  let routerMock: jasmine.SpyObj<Router>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let carritoServiceMock: jasmine.SpyObj<CarritoService>;
  let alumnosServiceMock: jasmine.SpyObj<AlumnosService>;
  let notifServiceMock: jasmine.SpyObj<NotificacionesService>;
  let usuarioServiceMock: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['logout']);
    carritoServiceMock = jasmine.createSpyObj('CarritoService', [], {
      cantidadTotal: signal(0)
    });
    alumnosServiceMock = jasmine.createSpyObj('AlumnosService', ['asegurarCargados'], {
      alumnos: signal([])
    });
    notifServiceMock = jasmine.createSpyObj('NotificacionesService', ['obtenerNotificaciones'], {
      notificaciones: signal([]),
      cantidad: signal(0)
    });
    usuarioServiceMock = jasmine.createSpyObj('UsuarioService', ['homeUrl'], {
      esVistaAlumno: signal(false),
      esVistaKiosquero: signal(false)
    });
    
    usuarioServiceMock.homeUrl.and.returnValue('/home');

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: CarritoService, useValue: carritoServiceMock },
        { provide: AlumnosService, useValue: alumnosServiceMock },
        { provide: NotificacionesService, useValue: notifServiceMock },
        { provide: UsuarioService, useValue: usuarioServiceMock },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    
    routerMock = TestBed.inject(Router) as unknown;
    spyOn(routerMock, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    spyOn(routerMock, 'navigate').and.returnValue(Promise.resolve(true));
    
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('dado que se inicializa, deberia crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('dado que llamo a irAlCarrito, deberia navegar a /compra', () => {
    component['irAlCarrito']();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/compra');
  });

  it('dado que llamo a irAInicio, deberia navegar a homeUrl', () => {
    const event = new Event('click');
    spyOn(event, 'preventDefault');
    component['irAInicio'](event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('dado que llamo a toggleMenu, deberia alternar estado y cerrar otros', () => {
    component['menuKiosqueroAbierto'].set(true);
    component['menuNotifAbierto'].set(true);
    
    component['toggleMenu']();
    
    expect(component['menuAbierto']()).toBeTrue();
    expect(component['menuKiosqueroAbierto']()).toBeFalse();
    expect(component['menuNotifAbierto']()).toBeFalse();
    
    component['toggleMenu']();
    expect(component['menuAbierto']()).toBeFalse();
    expect(component['menuBilleteraAbierto']()).toBeFalse();
  });

  it('dado que llamo a toggleMenuBilletera sin alumnos, deberia cargar alumnos', () => {
    component['toggleMenuBilletera']();
    expect(component['menuBilleteraAbierto']()).toBeTrue();
    expect(alumnosServiceMock.asegurarCargados).toHaveBeenCalled();
  });

  it('dado que llamo a toggleNotificaciones, deberia cerrar otros menues y obtener notificaciones', () => {
    component['menuAbierto'].set(true);
    component['toggleNotificaciones']();
    
    expect(component['menuNotifAbierto']()).toBeTrue();
    expect(component['menuAbierto']()).toBeFalse();
    expect(notifServiceMock.obtenerNotificaciones).toHaveBeenCalled();
  });

  it('dado que hago clickEnNotificacion tipo RESUMEN_SEMANAL, deberia navegar', () => {
    component['clickEnNotificacion']({ tipo: 'RESUMEN_SEMANAL', mensaje: '', titulo: '', fecha: new Date().toISOString(), id: '1' });
    expect(component['menuNotifAbierto']()).toBeFalse();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/resumen-semanal');
  });

  it('dado que llamo a toggleMenuKiosquero, deberia cerrar otros menues', () => {
    component['menuAbierto'].set(true);
    component['toggleMenuKiosquero']();
    
    expect(component['menuKiosqueroAbierto']()).toBeTrue();
    expect(component['menuAbierto']()).toBeFalse();
  });

  it('dado que llamo a irARecomendacionesEstacionales, deberia navegar', () => {
    component['irARecomendacionesEstacionales']();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/recomendaciones-estacionales');
  });

  it('dado que llamo a irAPromociones, deberia navegar', () => {
    component['irAPromociones']();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/promociones');
  });

  it('dado que llamo a irAPerfil, deberia navegar', () => {
    component['irAPerfil']();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/perfil');
  });

  it('dado que llamo a irABilletera, deberia navegar', () => {
    component['irABilletera']();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/billetera');
  });

  it('dado que llamo a irABilleteraDeHijo, deberia navegar con id', () => {
    component['irABilleteraDeHijo']('123');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/billetera', '123']);
  });

  it('dado que llamo a cerrarSesion, deberia cerrar sesion', fakeAsync(() => {
    authServiceMock.logout.and.returnValue(Promise.resolve());
    component['cerrarSesion']();
    flushMicrotasks();
    expect(authServiceMock.logout).toHaveBeenCalled();
  }));

  it('dado que cerrarSesion falla, deberia navegar a /', fakeAsync(() => {
    authServiceMock.logout.and.returnValue(Promise.reject('error'));
    component['cerrarSesion']();
    flushMicrotasks();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
  }));

  it('dado que presiono escape, deberia cerrar todos los menues', () => {
    component['menuAbierto'].set(true);
    component['menuNotifAbierto'].set(true);
    component['menuKiosqueroAbierto'].set(true);
    component['menuBilleteraAbierto'].set(true);
    
    component['onEscape']();
    
    expect(component['menuAbierto']()).toBeFalse();
    expect(component['menuNotifAbierto']()).toBeFalse();
    expect(component['menuKiosqueroAbierto']()).toBeFalse();
    expect(component['menuBilleteraAbierto']()).toBeFalse();
  });

  it('dado que hago click en el documento fuera del navbar, deberia cerrar menues', () => {
    component['menuAbierto'].set(true);
    
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: document.body });
    
    component['onDocumentClick'](event);
    
    expect(component['menuAbierto']()).toBeFalse();
  });

  it('dado que hago click en el documento pero los menues estan cerrados, no deberia hacer nada', () => {
    const event = new MouseEvent('click');
    component['onDocumentClick'](event);
    expect(component['menuAbierto']()).toBeFalse();
  });
});
