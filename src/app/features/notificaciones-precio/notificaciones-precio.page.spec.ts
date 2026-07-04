import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesPrecioPage } from './notificaciones-precio.page';
import { NotificacionesPrecioService } from './services/notificaciones-precio.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { of } from 'rxjs';
import { Component, Input, signal } from '@angular/core';
import { NotificacionPrecio } from './models/notificacion-precio.model';
import { NotificacionPrecioCardComponent } from './components/notificacion-precio-card/notificacion-precio-card';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificacionesPrecioMother } from './notificaciones-precio.mother';



@Component({
  selector: 'app-notificacion-precio-card',
  template: '',
  standalone: true
})
class NotificacionPrecioCardStub {
  @Input() notificacion!: NotificacionPrecio;
}

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStub {
  @Input() userName = '';
}

describe('NotificacionesPrecioPage', () => {
  let servicioNotificaciones: jasmine.SpyObj<NotificacionesPrecioService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let component: NotificacionesPrecioPage;
  let fixture: ComponentFixture<NotificacionesPrecioPage>;

  beforeEach(async () => {
    servicioNotificaciones = jasmine.createSpyObj('NotificacionesPrecioService', ['getNotificaciones']);
    
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual'], {
      esVistaKiosquero: signal(true),
      esVistaAlumno: signal(false),
      nombreNavbar: signal('Kiosquero Test'),
      homeUrl: signal('/kiosquero')
    });

    servicioUsuario.getUsuarioActual.and.returnValue(NotificacionesPrecioMother.crearUsuario());

    await TestBed.configureTestingModule({
      imports: [NotificacionesPrecioPage],
      providers: [
        { provide: NotificacionesPrecioService, useValue: servicioNotificaciones },
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    })
      .overrideComponent(NotificacionesPrecioPage, {
        remove: {
          imports: [NotificacionPrecioCardComponent, NavbarComponent]
        },
        add: {
          imports: [NavbarStub, NotificacionPrecioCardStub]
        }
      })
      .compileComponents();
  });

  describe('Cuando el perfil de kiosquero existe en localStorage', () => {
    it('debería solicitar las notificaciones de precio al servicio y asignarlas al estado', () => {
      givenElPerfilDeKiosqueroExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenSeLlamoASolicitarNotificaciones();
    });
  });

  describe('Cuando la sesión no es válida', () => {
    it('no debería solicitar las notificaciones si el id de usuario no existe', () => {
      givenElPerfilNoExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenNoSeSolicitanNotificaciones();
    });

    it('no debería solicitar las notificaciones si el perfil no contiene un id', () => {
      givenElPerfilEstaMalFormado();
      whenSeCreaElComponenteYDetectaCambios();
      thenNoSeSolicitanNotificaciones();
    });
  });

  function givenElPerfilDeKiosqueroExiste(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-456' }));
    const notificacionesEsperadas = [NotificacionesPrecioMother.crearNotificacion()];
    servicioNotificaciones.getNotificaciones.and.returnValue(of(notificacionesEsperadas));
  }

  function givenElPerfilNoExiste(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }

  function givenElPerfilEstaMalFormado(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ role: 'admin' }));
  }

  function whenSeCreaElComponenteYDetectaCambios(): void {
    fixture = TestBed.createComponent(NotificacionesPrecioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function thenSeLlamoASolicitarNotificaciones(): void {
    expect(servicioNotificaciones.getNotificaciones).toHaveBeenCalledWith('user-id-456');
    expect(component.notificaciones.length).toBe(1);
  }

  function thenNoSeSolicitanNotificaciones(): void {
    expect(servicioNotificaciones.getNotificaciones).not.toHaveBeenCalled();
    expect(component.notificaciones.length).toBe(0);
  }
});
