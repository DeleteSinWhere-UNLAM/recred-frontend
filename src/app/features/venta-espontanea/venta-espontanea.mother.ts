import { Buffet } from '../buffet/models/buffet.model';
import {
  AlumnoResumen,
  ProductoVenta,
} from './services/venta-espontanea';

export const ALUMNO_ID_TEST = 'alumno-1';
export const BUFFET_ID_TEST = '0f8fad5b-d9cb-469f-a165-70867728950e';

export class AlumnoResumenMother {
  static crear(override: Partial<AlumnoResumen> = {}): AlumnoResumen {
    return {
      id: ALUMNO_ID_TEST,
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '12345678',
      ...override,
    };
  }

  static crearVarios(): AlumnoResumen[] {
    return [
      AlumnoResumenMother.crear(),
      AlumnoResumenMother.crear({
        id: 'alumno-2',
        nombre: 'Maria',
        apellido: 'Lopez',
        dni: '87654321',
      }),
    ];
  }
}

export class BuffetMother {
  static crear(override: Partial<Buffet> = {}): Buffet {
    return {
      id: BUFFET_ID_TEST,
      nombre: 'Buffet',
      colegioId: 'colegio-1',
      ...override,
    };
  }
}

export class ProductoVentaMother {
  static crear(override: Partial<ProductoVenta> = {}): ProductoVenta {
    return {
      id: 'prod-1',
      nombre: 'Alfajor',
      descripcion: 'Rico',
      precio: 500,
      categoria: { id: 'cat-1', descripcion: 'Golosinas' },
      clasificacionesSalud: [],
      imagen: 'alfajor.jpg',
      estadoStock: 'DISPONIBLE',
      cantidad: 0,
      ...override,
    };
  }

  static crearBloqueado(): ProductoVenta {
    return ProductoVentaMother.crear({
      id: 'prod-bloqueado',
      nombre: 'Golosina bloqueada',
      bloqueado: true,
    });
  }

  static crearSinStock(): ProductoVenta {
    return ProductoVentaMother.crear({
      id: 'prod-sin-stock',
      nombre: 'Sin stock',
      estadoStock: 'SIN_STOCK',
    });
  }

  static crearSuperaPresupuesto(): ProductoVenta {
    return ProductoVentaMother.crear({
      id: 'prod-supera',
      nombre: 'Caro',
      superaPresupuesto: true,
    });
  }

  static crearVarios(): ProductoVenta[] {
    return [
      ProductoVentaMother.crear(),
      ProductoVentaMother.crear({ id: 'prod-2', nombre: 'Jugo', precio: 300 }),
    ];
  }
}
