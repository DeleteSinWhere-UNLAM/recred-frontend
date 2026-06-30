import { Buffet } from './models/buffet.model';
import {
  CategoriaProducto,
  ClasificacionSalud,
  Producto,
} from './models/producto.model';

export class BuffetMother {
  static crear(override: Partial<Buffet> = {}): Buffet {
    return {
      id: 'buffet-1',
      nombre: 'El Buffet de Mariano',
      colegioId: 'colegio-1',
      ...override,
    };
  }
}

export class CategoriaProductoMother {
  static crear(override: Partial<CategoriaProducto> = {}): CategoriaProducto {
    return {
      id: 'comidas',
      descripcion: 'Comidas',
      ...override,
    };
  }
}

export class ClasificacionSaludMother {
  static crear(override: Partial<ClasificacionSalud> = {}): ClasificacionSalud {
    return {
      id: 'sin-tacc',
      descripcion: 'Sin TACC',
      ...override,
    };
  }
}

export class ProductoMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: 'prod-base',
      nombre: 'Sándwich de Jamón y Queso',
      descripcion: 'Delicioso tostado de jamón y queso',
      precio: 1200,
      categoria: { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: [ClasificacionSaludMother.crear()],
      imagen: 'sandwich.jpg',
      estadoStock: 'DISPONIBLE',
      ...override,
    };
  }

  static crearDisponible(override: Partial<Producto> = {}): Producto {
    return ProductoMother.crear({
      id: 'prod-libre',
      nombre: 'Agua Mineral',
      descripcion: 'Bebida',
      precio: 300,
      categoria: { id: 'bebidas', descripcion: 'Bebidas' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'DISPONIBLE',
      bloqueado: false,
      ...override,
    });
  }

  static crearBloqueadoPorTutor(override: Partial<Producto> = {}): Producto {
    return ProductoMother.crear({
      id: 'prod-tutor',
      nombre: 'Alfajor',
      descripcion: 'Dulce',
      precio: 500,
      categoria: { id: 'snacks', descripcion: 'Snacks' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'SIN_STOCK',
      bloqueado: true,
      ...override,
    });
  }

  static crearBloqueadoPorRestriccion(override: Partial<Producto> = {}): Producto {
    return ProductoMother.crear({
      id: 'prod-restriccion',
      nombre: 'Galletitas Oreo',
      descripcion: 'Con TACC',
      precio: 400,
      categoria: { id: 'snacks', descripcion: 'Snacks' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'SIN_STOCK',
      bloqueado: false,
      bloqueadoPorRestriccion: true,
      motivoBloqueo: 'Contiene: Gluten (TACC)',
      ...override,
    });
  }
}

export interface FranjaTest {
  id: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
}

export class FranjaMother {
  static crear(override: Partial<FranjaTest> = {}): FranjaTest {
    return {
      id: 'f1',
      horaInicio: '10:00',
      horaFin: '10:30',
      descripcion: 'PRIMER RECREO',
      ...override,
    };
  }
}
