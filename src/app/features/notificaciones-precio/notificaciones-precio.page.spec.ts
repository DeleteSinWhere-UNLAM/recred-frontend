import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesPrecioPage } from './notificaciones-precio.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NotificacionesPrecioPresenter } from './presenter/notificaciones-precio.presenter';
import { Component, Input, signal } from '@angular/core';
import { NotificacionPrecio } from './models/notificacion-precio.model';
import { NotificacionPrecioCardComponent } from './components/notificacion-precio-card/notificacion-precio-card';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificacionesPrecioMother } from './notificaciones-precio.mother';
import { BehaviorSubject } from 'rxjs';

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
  let fixture: ComponentFixture<NotificacionesPrecioPage>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let presenter: jasmine.SpyObj<NotificacionesPrecioPresenter>;
  
  let notificacionesSubject: BehaviorSubject<NotificacionPrecio[]>;
  let errorSubject: BehaviorSubject<string | null>;

  beforeEach(async () => {
    notificacionesSubject = new BehaviorSubject<NotificacionPrecio[]>([]);
    errorSubject = new BehaviorSubject<string | null>(null);

    presenter = jasmine.createSpyObj('NotificacionesPrecioPresenter', ['initialize'], {
      notificaciones$: notificacionesSubject.asObservable(),
      error$: errorSubject.asObservable()
    });
    
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
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    })
      .overrideComponent(NotificacionesPrecioPage, {
        remove: {
          imports: [NotificacionPrecioCardComponent, NavbarComponent],
          providers: [NotificacionesPrecioPresenter]
        },
        add: {
          imports: [NavbarStub, NotificacionPrecioCardStub],
          providers: [
            { provide: NotificacionesPrecioPresenter, useValue: presenter }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(NotificacionesPrecioPage);
  });

  it('debería inicializar el presenter al cargar la vista', () => {
    fixture.detectChanges();
    expect(presenter.initialize).toHaveBeenCalled();
  });
});
