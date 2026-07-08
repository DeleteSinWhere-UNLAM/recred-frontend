import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { NotificacionPrecio } from './models/notificacion-precio.model';
import { NotificacionesPrecioMother } from './notificaciones-precio.mother';
import { NotificacionesPrecioPage } from './notificaciones-precio.page';
import { NotificacionesPrecioService } from './services/notificaciones-precio.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
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
      nombreNavbar: signal('Kiosquero Integration'),
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
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();
  });

  it('dado el perfil en localStorage y 2 notificaciones del service, cuando se monta, deberia renderizar el titulo y una card por notificacion', () => {
    givenPerfilEnLocalStorage({ id: 'user-1' });
    givenNotificacionesDelBack([
      NotificacionesPrecioMother.crearNotificacion({
        titulo: 'Alfajor subió',
        productoId: 'prod-1',
      }),
      NotificacionesPrecioMother.crearNotificacion({
        titulo: 'Coca-Cola bajó',
        productoId: 'prod-2',
        mensaje: 'Precio -10%',
        razonIA: 'Promocion del proveedor',
      }),
    ]);

    whenMonto();

    const texto = textoRenderizado();
    expect(texto).toContain('Cambios de precio');
    expect(texto).toContain('Alfajor subió');
    expect(texto).toContain('Coca-Cola bajó');
    expect(texto).toContain('Promocion del proveedor');
    expect(queryAll('app-notificacion-precio-card').length).toBe(2);
  });

  it('dado que el service devuelve lista vacia, cuando se monta, deberia mostrar el estado vacio y no renderizar cards', () => {
    givenPerfilEnLocalStorage({ id: 'user-1' });
    givenNotificacionesDelBack([]);

    whenMonto();

    expect(textoRenderizado()).toContain('No hay notificaciones disponibles.');
    expect(queryAll('app-notificacion-precio-card').length).toBe(0);
  });

  it('dado sin perfil en localStorage, cuando se monta, no deberia llamar al service ni renderizar cards', () => {
    givenSinPerfilEnLocalStorage();

    whenMonto();

    expect(servicioNotificaciones.getNotificaciones).not.toHaveBeenCalled();
    expect(queryAll('app-notificacion-precio-card').length).toBe(0);
    expect(textoRenderizado()).toContain('No hay notificaciones disponibles.');
  });

  function givenPerfilEnLocalStorage(perfil: { id: string }): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(perfil));
  }

  function givenSinPerfilEnLocalStorage(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }

  function givenNotificacionesDelBack(notificaciones: NotificacionPrecio[]): void {
    servicioNotificaciones.getNotificaciones.and.returnValue(of(notificaciones));
  }

  function whenMonto(): void {
    fixture = TestBed.createComponent(NotificacionesPrecioPage);
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryAll(selector: string): NodeListOf<Element> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll(selector);
  }
});
