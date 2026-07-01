import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, Input, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NotificacionesPrecioPage } from './notificaciones-precio.page';
import { NotificacionesPrecioService } from './services/notificaciones-precio.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificacionesPrecioMother } from './notificaciones-precio.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStub {
  @Input() userName = '';
}

describe('NotificacionesPrecio Integration', () => {
  let fixture: ComponentFixture<NotificacionesPrecioPage>;
  let servicioNotificaciones: jasmine.SpyObj<NotificacionesPrecioService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

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
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: NotificacionesPrecioService, useValue: servicioNotificaciones }
      ]
    })
      .overrideComponent(NotificacionesPrecioPage, {
        remove: {
          imports: [NavbarComponent]
        },
        add: {
          imports: [NavbarStub]
        }
      })
      .compileComponents();
  });

  it('debería renderizar la lista de notificaciones cuando el servicio responde con datos', () => {
    const notificaciones = [
      NotificacionesPrecioMother.crearNotificacion({ titulo: 'Subió el Alfajor' }),
      NotificacionesPrecioMother.crearNotificacion({ titulo: 'Bajó la Gaseosa', productoId: 'prod-gaseosa' })
    ];
    servicioNotificaciones.getNotificaciones.and.returnValue(of(notificaciones));
    fixture = TestBed.createComponent(NotificacionesPrecioPage);
    
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('.notificaciones__titulo').textContent;
    const tarjetas = fixture.debugElement.queryAll(By.css('app-notificacion-precio-card'));
    const lista = fixture.nativeElement.querySelector('.notificaciones__lista');
    
    expect(titulo).toContain('Cambios de precio');
    expect(lista).toBeTruthy();
    expect(tarjetas.length).toBe(2);
  });

  it('debería mostrar el estado vacío cuando el servicio devuelve un arreglo vacío', () => {
    servicioNotificaciones.getNotificaciones.and.returnValue(of([]));
    fixture = TestBed.createComponent(NotificacionesPrecioPage);
    
    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('app-notificacion-precio-card'));
    const vacio = fixture.nativeElement.querySelector('.notificaciones__vacio');
    
    expect(tarjetas.length).toBe(0);
    expect(vacio).toBeTruthy();
    expect(vacio.textContent).toContain('No hay notificaciones disponibles.');
  });

  it('debería mostrar el error cuando el presenter ataja una falla de red', () => {
    servicioNotificaciones.getNotificaciones.and.returnValue(throwError(() => new Error('Error 500')));
    fixture = TestBed.createComponent(NotificacionesPrecioPage);
    
    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('app-notificacion-precio-card'));
    const errorPanel = fixture.nativeElement.querySelector('.notificaciones__error');
    
    expect(tarjetas.length).toBe(0);
    expect(errorPanel).toBeTruthy();
    expect(errorPanel.textContent).toContain('Error al cargar las notificaciones.');
  });
});
