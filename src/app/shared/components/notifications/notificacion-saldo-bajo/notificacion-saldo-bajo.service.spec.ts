import { TestBed } from '@angular/core/testing';
import { NotificacionSaldoBajoService } from './notificacion-saldo-bajo.service';

describe('NotificacionSaldoBajoService', () => {
  let service: NotificacionSaldoBajoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacionSaldoBajoService);
  });

  it('dado que se inicializa el servicio, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('dado que se consulta el estado inicial, debe devolver los valores por defecto', () => {
    expect(service.state$()).toEqual({ show: false, balance: 0, alumnoId: '' });
  });

  it('dado que se llama a mostrar, debe actualizar el estado con el balance y el alumnoId', () => {
    service.mostrar(150, 'alumno-123');
    expect(service.state$()).toEqual({ show: true, balance: 150, alumnoId: 'alumno-123' });
  });

  it('dado que se llama a cerrar, debe ocultar la notificación', () => {
    service.mostrar(150, 'alumno-123');
    service.cerrar();
    expect(service.state$()).toEqual({ show: false, balance: 150, alumnoId: 'alumno-123' });
  });
});
