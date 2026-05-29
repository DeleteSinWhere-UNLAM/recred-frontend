import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { Router } from '@angular/router';
import { CarritoService } from '../../../features/compra/data/carrito.service';

describe('NavbarComponent - Notificaciones', () => {

  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  const routerMock = {
    navigateByUrl: jasmine.createSpy('navigateByUrl')
  };

  const carritoMock = {
    cantidadTotal: () => 2
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: CarritoService, useValue: carritoMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // 1. mostrar notificaciones al hacer click en la campana
  it('debería mostrar el dropdown de notificaciones', () => {
    expect(component.showNotifications).toBeFalse();

    component.toggleNotifications();

    expect(component.showNotifications).toBeTrue();
  });

  // 2. cerrar dropdown al navegar
  it('debería cerrar notificaciones al navegar', () => {
    component.showNotifications = true;

    component.goToNotification('/sugerencias');

    expect(component.showNotifications).toBeFalse();
    expect(routerMock.navigateByUrl)
      .toHaveBeenCalledWith('/sugerencias');
  });

  // 3. notificaciones iniciales
  it('debería tener notificaciones iniciales', () => {
    expect(component['notifications'].length).toBeGreaterThan(0);
  });

});