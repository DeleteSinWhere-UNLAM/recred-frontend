import { Producto } from '../buffet/models/producto.model';

export const UUID_ALUMNO = '12345678-1234-1234-1234-1234567890ab';
export const UUID_PRODUCTO = 'abcdefab-abcd-abcd-abcd-abcdefabcdef';
export const ID_ALUMNO_NO_UUID = 'julian-garcia';

export interface ProductDTOTest {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  urlImagen?: string | null;
  stockActual?: number;
  categoria?: { id: string; descripcion: string } | null;
  clasificacionesSalud?: { id: string; descripcion: string }[] | null;
}

export class ProductoFavoritoMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: UUID_PRODUCTO,
      nombre: 'Tostado de Jamon y Queso',
      descripcion: 'Tostado clasico',
      precio: 1500,
      categoria: { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: [],
      imagen: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
      estadoStock: 'DISPONIBLE',
      ...override,
    };
  }

  static crearAlfajor(override: Partial<Producto> = {}): Producto {
    return ProductoFavoritoMother.crear({
      id: 'prod-alfajor',
      nombre: 'Alfajor Triple',
      descripcion: 'Alfajor de chocolate triple relleno de dulce de leche',
      precio: 1200,
      categoria: { id: 'kiosco', descripcion: 'Kiosco' },
      imagen: '',
      ...override,
    });
  }
}

export class ProductDTOMother {
  static crear(override: Partial<ProductDTOTest> = {}): ProductDTOTest {
    return {
      id: UUID_PRODUCTO,
      nombre: 'Tostado de Jamon y Queso',
      descripcion: 'Tostado clasico',
      precio: 1500,
      stockActual: 5,
      categoria: { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: [],
      ...override,
    };
  }

  static crearSinStock(): ProductDTOTest {
    return ProductDTOMother.crear({ stockActual: 0 });
  }
}
