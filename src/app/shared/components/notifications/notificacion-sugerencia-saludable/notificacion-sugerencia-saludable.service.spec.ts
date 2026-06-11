import { TestBed } from '@angular/core/testing';
import { NotificacionSugerenciaSaludableService } from './notificacion-sugerencia-saludable.service';

describe('NotificacionSugerenciaSaludableService', () => {
  let service: NotificacionSugerenciaSaludableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacionSugerenciaSaludableService);
  });

  it('dado que se inicializa el servicio, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('dado que se consulta el estado inicial, debe devolver los valores por defecto', () => {
    expect(service.state$()).toEqual({ show: false, sugerenciaId: '', titulo: '', mensaje: '', producto: null, alumnoId: '' });
  });

  it('dado que se llama a mostrar, debe actualizar el estado', () => {
    const mockProducto = { id: 'prod-1', nombre: 'Manzana Roja', precio: 150.00 } as any;
    service.mostrar('sug-1', 'Titulo', 'Mensaje', mockProducto, 'alum-1');
    expect(service.state$()).toEqual({ show: true, sugerenciaId: 'sug-1', titulo: 'Titulo', mensaje: 'Mensaje', producto: mockProducto, alumnoId: 'alum-1' });
  });

  it('dado que se llama a cerrar, debe ocultar la notificación', () => {
    const mockProducto = { id: 'prod-1', nombre: 'Manzana Roja', precio: 150.00 } as any;
    service.mostrar('sug-1', 'Titulo', 'Mensaje', mockProducto, 'alum-1');
    service.cerrar();
    expect(service.state$()).toEqual({ show: false, sugerenciaId: 'sug-1', titulo: 'Titulo', mensaje: 'Mensaje', producto: mockProducto, alumnoId: 'alum-1' });
  });
});
