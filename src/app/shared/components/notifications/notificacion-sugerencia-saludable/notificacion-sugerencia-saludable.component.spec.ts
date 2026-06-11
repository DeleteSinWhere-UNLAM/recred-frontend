import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionSugerenciaSaludableComponent } from './notificacion-sugerencia-saludable.component';
import { NotificacionSugerenciaSaludableService } from './notificacion-sugerencia-saludable.service';
import { CarritoService } from '../../../../features/compra/services/carrito.service';
import { Router } from '@angular/router';
import { Producto } from '../../../../features/buffet/models/producto.model';

describe('NotificacionSugerenciaSaludableComponent', () => {
  let component: NotificacionSugerenciaSaludableComponent;
  let fixture: ComponentFixture<NotificacionSugerenciaSaludableComponent>;
  let notificacionServiceSpy: jasmine.SpyObj<NotificacionSugerenciaSaludableService>;
  let carritoSpy: jasmine.SpyObj<CarritoService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockProducto = { id: 'prod-1', nombre: 'Manzana Roja', precio: 150.00 } as unknown as Producto;

  beforeEach(async () => {
    notificacionServiceSpy = jasmine.createSpyObj('NotificacionSugerenciaSaludableService', ['cerrar'], {
      state$: () => ({ show: true, sugerenciaId: 'sug-1', titulo: 'Titulo', mensaje: 'Mensaje', producto: mockProducto, alumnoId: 'alum-1' })
    });
    carritoSpy = jasmine.createSpyObj('CarritoService', ['agregar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [NotificacionSugerenciaSaludableComponent],
      providers: [
        { provide: NotificacionSugerenciaSaludableService, useValue: notificacionServiceSpy },
        { provide: CarritoService, useValue: carritoSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionSugerenciaSaludableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa el componente, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('dado que se hace clic en cerrar, debe llamar al método cerrar del servicio', () => {
    component.cerrar();
    expect(notificacionServiceSpy.cerrar).toHaveBeenCalled();
  });

  it('dado que se hace clic en comprarProducto, debe agregar al carrito, navegar a compra y cerrar la notificación', () => {
    component.comprarProducto();
    expect(carritoSpy.agregar).toHaveBeenCalledWith(mockProducto, 'alum-1', 1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/compra']);
    expect(notificacionServiceSpy.cerrar).toHaveBeenCalled();
  });
});
