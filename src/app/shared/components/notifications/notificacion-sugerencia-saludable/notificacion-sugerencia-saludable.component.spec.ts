import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionSugerenciaSaludableComponent } from './notificacion-sugerencia-saludable.component';
import { NotificacionSugerenciaSaludableService, SugerenciaSaludableState } from './notificacion-sugerencia-saludable.service';
import { CarritoService } from '../../../../features/compra/services/carrito.service';
import { Router } from '@angular/router';
import { Producto } from '../../../../features/buffet/models/producto.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { ToastService } from '../../../services/toast.service';
import { AcreditarMercadoPagoService } from '../../../../features/acreditar-mercado-pago/services/acreditar-mercado-pago.service';
import { CompraService } from '../../../../features/compra/services/compra.service';
import { Alumno } from '../../../../data-access/models/alumno.model';

describe('NotificacionSugerenciaSaludableComponent', () => {
  let component: NotificacionSugerenciaSaludableComponent;
  let fixture: ComponentFixture<NotificacionSugerenciaSaludableComponent>;
  let notificacionServiceSpy: jasmine.SpyObj<NotificacionSugerenciaSaludableService>;
  let carritoSpy: jasmine.SpyObj<CarritoService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let mpServiceSpy: jasmine.SpyObj<AcreditarMercadoPagoService>;
  let compraServiceSpy: jasmine.SpyObj<CompraService>;

  const mockProducto = { id: 'prod-1', nombre: 'Manzana Roja', precio: 150.00 } as unknown as Producto;

  beforeEach(async () => {
    notificacionServiceSpy = jasmine.createSpyObj('NotificacionSugerenciaSaludableService', ['cerrar']);
    (notificacionServiceSpy as { state$: jasmine.Spy }).state$ = jasmine.createSpy('state$').and.returnValue({ 
      show: true, sugerenciaId: 'sug-1', titulo: 'Titulo', mensaje: 'Mensaje', producto: mockProducto, alumnoId: 'alum-1' 
    } as SugerenciaSaludableState);
    
    carritoSpy = jasmine.createSpyObj('CarritoService', ['agregar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['mostrar']);
    mpServiceSpy = jasmine.createSpyObj('AcreditarMercadoPagoService', ['generarLinkPago']);
    compraServiceSpy = jasmine.createSpyObj('CompraService', ['setSugerenciaPendiente']);

    await TestBed.configureTestingModule({
      imports: [NotificacionSugerenciaSaludableComponent],
      providers: [
        { provide: NotificacionSugerenciaSaludableService, useValue: notificacionServiceSpy },
        { provide: CarritoService, useValue: carritoSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: AcreditarMercadoPagoService, useValue: mpServiceSpy },
        { provide: CompraService, useValue: compraServiceSpy }
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

  it('dado que el alumno tiene saldo suficiente, al comprar debe agregar al carrito, marcar sugerencia pendiente y navegar al carrito', async () => {
    alumnosServiceSpy.asegurarCargados.and.returnValue(Promise.resolve([]));
    alumnosServiceSpy.getAlumnoById.and.returnValue({ id: 'alum-1', nombre: 'Juan', apellido: 'Perez', saldo: 200 } as Alumno);

    await component.comprarProducto();

    expect(carritoSpy.agregar).toHaveBeenCalledWith(mockProducto, 'alum-1', 1);
    expect(compraServiceSpy.setSugerenciaPendiente).toHaveBeenCalledWith('sug-1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/compra']);
    expect(notificacionServiceSpy.cerrar).toHaveBeenCalled();
  });

  it('dado que el alumno NO tiene saldo suficiente, debe generar link de MP y mostrar toast', async () => {
    alumnosServiceSpy.asegurarCargados.and.returnValue(Promise.resolve([]));
    alumnosServiceSpy.getAlumnoById.and.returnValue({ id: 'alum-1', nombre: 'Juan', apellido: 'Perez', saldo: 50 } as Alumno);
    mpServiceSpy.generarLinkPago.and.returnValue(Promise.resolve('https://mp.link'));

    await component.comprarProducto();

    expect(mpServiceSpy.generarLinkPago).toHaveBeenCalledWith('alum-1', 150.00);
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/Saldo insuficiente/),
      'error',
      8000
    );
    expect(carritoSpy.agregar).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
