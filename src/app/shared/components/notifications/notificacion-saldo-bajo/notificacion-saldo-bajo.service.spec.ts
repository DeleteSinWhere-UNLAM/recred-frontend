import { TestBed } from '@angular/core/testing';
import { NotificacionSaldoBajoService } from './notificacion-saldo-bajo.service';

describe('NotificacionSaldoBajoService', () => {
  let service: NotificacionSaldoBajoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacionSaldoBajoService);
  });

  it('dado el TestBed configurado, cuando inyecto el service, deberia crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('dado el service recien inyectado, cuando consulto el estado, deberia devolver los valores por defecto', () => {
    thenElEstadoEs(false, 0, '');
  });

  it('dado un balance y alumnoId, cuando llamo mostrar, deberia actualizar el estado con esos valores', () => {
    whenMuestroLaNotificacion(150, 'alumno-123');

    thenElEstadoEs(true, 150, 'alumno-123');
  });

  it('dado el estado mostrado, cuando llamo cerrar, deberia ocultar la notificacion pero preservar balance y alumnoId', () => {
    whenMuestroLaNotificacion(150, 'alumno-123');

    whenCierroLaNotificacion();

    thenElEstadoEs(false, 150, 'alumno-123');
  });

  function whenMuestroLaNotificacion(balance: number, alumnoId: string): void {
    service.mostrar(balance, alumnoId);
  }

  function whenCierroLaNotificacion(): void {
    service.cerrar();
  }

  function thenElEstadoEs(show: boolean, balance: number, alumnoId: string): void {
    expect(service.state$()).toEqual({ show, balance, alumnoId });
  }
});
