import { TestBed } from '@angular/core/testing';
import { Producto } from '../../../../features/buffet/models/producto.model';
import { NotificacionSugerenciaSaludableService } from './notificacion-sugerencia-saludable.service';

class ProductoSugerenciaMother {
  static crear(): Producto {
    return { id: 'prod-1', nombre: 'Manzana Roja', precio: 150.0 } as unknown as Producto;
  }
}

describe('NotificacionSugerenciaSaludableService', () => {
  let service: NotificacionSugerenciaSaludableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacionSugerenciaSaludableService);
  });

  it('dado el TestBed configurado, cuando inyecto el service, deberia crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('dado el service recien inyectado, cuando consulto el estado, deberia devolver los valores por defecto', () => {
    thenElEstadoEs(false, '', '', '', null, '');
  });

  it('dado los datos de la sugerencia, cuando llamo mostrar, deberia actualizar el estado', () => {
    const producto = ProductoSugerenciaMother.crear();

    whenMuestroLaSugerencia('sug-1', 'Titulo', 'Mensaje', producto, 'alum-1');

    thenElEstadoEs(true, 'sug-1', 'Titulo', 'Mensaje', producto, 'alum-1');
  });

  it('dado el estado mostrado, cuando llamo cerrar, deberia ocultar la notificacion pero preservar los datos', () => {
    const producto = ProductoSugerenciaMother.crear();
    whenMuestroLaSugerencia('sug-1', 'Titulo', 'Mensaje', producto, 'alum-1');

    whenCierroLaSugerencia();

    thenElEstadoEs(false, 'sug-1', 'Titulo', 'Mensaje', producto, 'alum-1');
  });

  function whenMuestroLaSugerencia(
    sugerenciaId: string,
    titulo: string,
    mensaje: string,
    producto: Producto,
    alumnoId: string,
  ): void {
    service.mostrar(sugerenciaId, titulo, mensaje, producto, alumnoId);
  }

  function whenCierroLaSugerencia(): void {
    service.cerrar();
  }

  function thenElEstadoEs(
    show: boolean,
    sugerenciaId: string,
    titulo: string,
    mensaje: string,
    producto: Producto | null,
    alumnoId: string,
  ): void {
    expect(service.state$()).toEqual({ show, sugerenciaId, titulo, mensaje, producto, alumnoId });
  }
});
