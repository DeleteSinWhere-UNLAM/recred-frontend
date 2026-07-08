import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificacionPrecioCardComponent } from './components/notificacion-precio-card/notificacion-precio-card';
import { NotificacionPrecio } from './models/notificacion-precio.model';
import { NotificacionesPrecioMother } from './notificaciones-precio.mother';
import { NotificacionesPrecioPage } from './notificaciones-precio.page';
import { NotificacionesPrecioService } from './services/notificaciones-precio.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-notificacion-precio-card', template: '', standalone: true })
class NotificacionPrecioCardStub {
  @Input() notificacion!: NotificacionPrecio;
}

describe('NotificacionesPrecioPage', () => {
  let servicioNotificaciones: jasmine.SpyObj<NotificacionesPrecioService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioNotificaciones = jasmine.createSpyObj('NotificacionesPrecioService', ['getNotificaciones']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual'], {
      esVistaKiosquero: signal(true),
      esVistaAlumno: signal(false),
      nombreNavbar: signal('Kiosquero Test'),
      homeUrl: signal('/kiosquero'),
    });
    servicioUsuario.getUsuarioActual.and.returnValue(NotificacionesPrecioMother.crearUsuario());

    await TestBed.configureTestingModule({
      imports: [NotificacionesPrecioPage],
      providers: [
        { provide: NotificacionesPrecioService, useValue: servicioNotificaciones },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(NotificacionesPrecioPage, {
        remove: { imports: [NavbarComponent, NotificacionPrecioCardComponent] },
        add: { imports: [NavbarStub, NotificacionPrecioCardStub] },
      })
      .compileComponents();
  });

  describe('cuando hay perfil de kiosquero en localStorage', () => {
    let component: NotificacionesPrecioPage;
    let fixture: ComponentFixture<NotificacionesPrecioPage>;

    beforeEach(() => {
      givenPerfilEnLocalStorage('user-id-456');
      servicioNotificaciones.getNotificaciones.and.returnValue(
        of([NotificacionesPrecioMother.crearNotificacion()]),
      );

      fixture = TestBed.createComponent(NotificacionesPrecioPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('dado el perfil en localStorage, cuando se monta, deberia pedirle las notificaciones al service con ese id', () => {
      expect(servicioNotificaciones.getNotificaciones).toHaveBeenCalledWith('user-id-456');
      expect(component.notificaciones.length).toBe(1);
    });

    it('dado que el service devuelve notificaciones, cuando se monta, deberia renderizar una card por notificacion', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('app-notificacion-precio-card');
      expect(cards.length).toBe(1);
    });
  });

  describe('cuando no hay perfil en localStorage', () => {
    it('dado sin perfil, cuando se monta, no deberia llamar al service ni tener notificaciones', () => {
      givenSinPerfilEnLocalStorage();

      const fixture = TestBed.createComponent(NotificacionesPrecioPage);
      fixture.detectChanges();

      expect(servicioNotificaciones.getNotificaciones).not.toHaveBeenCalled();
      expect(fixture.componentInstance.notificaciones.length).toBe(0);
    });

    it('dado sin notificaciones, cuando renderizo la page, deberia mostrar el estado vacio', () => {
      givenSinPerfilEnLocalStorage();

      const fixture = TestBed.createComponent(NotificacionesPrecioPage);
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'No hay notificaciones disponibles.',
      );
    });
  });

  describe('nombreUsuario', () => {
    it('dado un usuario en UsuarioService, deberia exponer su nombre para el navbar', () => {
      givenSinPerfilEnLocalStorage();

      const fixture = TestBed.createComponent(NotificacionesPrecioPage);

      expect(fixture.componentInstance.nombreUsuario).toBe('Kiosquero Test');
    });
  });

  function givenPerfilEnLocalStorage(usuarioId: string): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: usuarioId }));
  }

  function givenSinPerfilEnLocalStorage(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }
});
