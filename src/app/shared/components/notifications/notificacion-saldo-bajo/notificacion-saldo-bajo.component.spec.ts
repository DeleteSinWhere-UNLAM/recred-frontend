import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionSaldoBajoComponent } from './notificacion-saldo-bajo.component';
import { NotificacionSaldoBajoService } from './notificacion-saldo-bajo.service';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../../../core/services/alumno-contexto.service';

describe('NotificacionSaldoBajoComponent', () => {
  let component: NotificacionSaldoBajoComponent;
  let fixture: ComponentFixture<NotificacionSaldoBajoComponent>;
  let notificacionServiceSpy: jasmine.SpyObj<NotificacionSaldoBajoService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let contextoServiceSpy: jasmine.SpyObj<AlumnoContextoService>;

  beforeEach(async () => {
    notificacionServiceSpy = jasmine.createSpyObj('NotificacionSaldoBajoService', ['cerrar'], {
      state$: () => ({ show: true, balance: 100, alumnoId: 'test-alumno-id' })
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    contextoServiceSpy = jasmine.createSpyObj<AlumnoContextoService>('AlumnoContextoService', ['setAlumnoId']);

    await TestBed.configureTestingModule({
      imports: [NotificacionSaldoBajoComponent],
      providers: [
        { provide: NotificacionSaldoBajoService, useValue: notificacionServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AlumnoContextoService, useValue: contextoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionSaldoBajoComponent);
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

  it('dado que se hace clic en comprarSaldo, debe cerrar la notificación y navegar a acreditar-mercado-pago', () => {
    component.comprarSaldo();
    expect(notificacionServiceSpy.cerrar).toHaveBeenCalled();
    expect(contextoServiceSpy.setAlumnoId).toHaveBeenCalledWith('test-alumno-id');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/acreditar-mercado-pago');
  });
});
