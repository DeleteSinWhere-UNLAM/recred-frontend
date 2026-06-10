import { TestBed } from '@angular/core/testing';
import { NotificacionSaldoBajoService } from './notificacion-saldo-bajo.service';

describe('NotificacionSaldoBajoService', () => {
  let service: NotificacionSaldoBajoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacionSaldoBajoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(service.state$()).toEqual({ show: false, balance: 0, alumnoId: '' });
  });

  it('should set state when mostrar is called', () => {
    service.mostrar(150, 'alumno-123');
    expect(service.state$()).toEqual({ show: true, balance: 150, alumnoId: 'alumno-123' });
  });

  it('should hide notification when cerrar is called', () => {
    service.mostrar(150, 'alumno-123');
    service.cerrar();
    expect(service.state$()).toEqual({ show: false, balance: 150, alumnoId: 'alumno-123' });
  });
});
