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
  const PRODUCTO_MOCK = { id: 'prod-1', nombre: 'Manzana Roja', precio: 150.0 } as unknown as Producto;

  let component: NotificacionSugerenciaSaludableComponent;
  let fixture: ComponentFixture<NotificacionSugerenciaSaludableComponent>;
  let notificacionServiceSpy: jasmine.SpyObj<NotificacionSugerenciaSaludableService>;
  let carritoSpy: jasmine.SpyObj<CarritoService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let mpServiceSpy: jasmine.SpyObj<AcreditarMercadoPagoService>;
  let compraServiceSpy: jasmine.SpyObj<CompraService>;

  beforeEach(async () => {
    notificacionServiceSpy = jasmine.createSpyObj('NotificacionSugerenciaSaludableService', ['cerrar']);
    givenNotificacionState({
      show: true,
      sugerenciaId: 'sug-1',
      titulo: 'Titulo',
      mensaje: 'Mensaje',
      producto: PRODUCTO_MOCK,
      alumnoId: 'alum-1',
    });

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
        { provide: CompraService, useValue: compraServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionSugerenciaSaludableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado el componente, cuando se monta, deberia crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('dado el componente, cuando hago click en cerrar, deberia llamar al metodo cerrar del servicio', () => {
    component.cerrar();

    expect(notificacionServiceSpy.cerrar).toHaveBeenCalled();
  });

  it('dado un alumno con saldo suficiente, cuando compro, deberia agregar al carrito, marcar sugerencia pendiente y navegar al carrito', async () => {
    givenAlumnoConSaldo(200);

    await component.comprarProducto();

    expect(carritoSpy.agregar).toHaveBeenCalledWith(PRODUCTO_MOCK, 'alum-1', 1);
    expect(compraServiceSpy.setSugerenciaPendiente).toHaveBeenCalledWith('sug-1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/compra']);
    expect(notificacionServiceSpy.cerrar).toHaveBeenCalled();
  });

  it('dado un alumno SIN saldo suficiente, cuando compro, deberia generar link de MP y mostrar toast', async () => {
    givenAlumnoConSaldo(50);
    mpServiceSpy.generarLinkPago.and.returnValue(Promise.resolve('https://mp.link'));

    await component.comprarProducto();

    expect(mpServiceSpy.generarLinkPago).toHaveBeenCalledWith('alum-1', 150.0);
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/Saldo insuficiente/),
      'error',
      8000,
    );
    expect(carritoSpy.agregar).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('dado un state sin producto, cuando compro, deberia cerrar la notificacion sin llamar al carrito', async () => {
    givenNotificacionState({
      show: true,
      sugerenciaId: 'sug-1',
      titulo: 'x',
      mensaje: 'y',
      producto: null,
      alumnoId: 'alum-1',
    });

    await component.comprarProducto();

    expect(notificacionServiceSpy.cerrar).toHaveBeenCalled();
    expect(carritoSpy.agregar).not.toHaveBeenCalled();
  });

  it('dado un alumno inexistente, cuando compro, deberia mostrar toast de error y cerrar', async () => {
    alumnosServiceSpy.asegurarCargados.and.returnValue(Promise.resolve([]));
    alumnosServiceSpy.getAlumnoById.and.returnValue(undefined);

    await component.comprarProducto();

    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/informaci/i),
      'error',
    );
    expect(notificacionServiceSpy.cerrar).toHaveBeenCalled();
  });

  it('dado que asegurarCargados falla, cuando compro, deberia loguear y mostrar toast generico', async () => {
    spyOn(console, 'error');
    alumnosServiceSpy.asegurarCargados.and.rejectWith(new Error('backend caido'));

    await component.comprarProducto();

    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/error/i),
      'error',
    );
    expect(console.error).toHaveBeenCalled();
  });

  function givenNotificacionState(state: SugerenciaSaludableState): void {
    (notificacionServiceSpy as { state$: jasmine.Spy }).state$ = jasmine
      .createSpy('state$')
      .and.returnValue(state);
  }

  function givenAlumnoConSaldo(saldo: number): void {
    alumnosServiceSpy.asegurarCargados.and.returnValue(Promise.resolve([]));
    alumnosServiceSpy.getAlumnoById.and.returnValue({
      id: 'alum-1',
      nombre: 'Juan',
      apellido: 'Perez',
      saldo,
    } as Alumno);
  }
});
