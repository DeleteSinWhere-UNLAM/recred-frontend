import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { Producto } from '../buffet/models/producto.model';
import { ItemCarrito } from './models/carrito.model';
import {
  OrdenAlumno,
  OrdenCompra,
  Recreo,
} from './models/orden-compra.model';
import { SugerenciaCarrito } from './models/sugerencia-carrito.model';

export class ProductoMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: 'prod-1',
      nombre: 'Alfajor',
      descripcion: 'Alfajor de chocolate',
      precio: 500,
      categoria: { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'DISPONIBLE',
      ...override,
    };
  }

  static crearSinStock(override: Partial<Producto> = {}): Producto {
    return ProductoMother.crear({ estadoStock: 'SIN_STOCK', ...override });
  }
}

export class ItemCarritoMother {
  static crear(override: Partial<ItemCarrito> = {}): ItemCarrito {
    return {
      id: 'item-1',
      alumnoId: 'alumno-1',
      producto: ProductoMother.crear(),
      cantidad: 1,
      ...override,
    };
  }

  static crearParaAlumno(alumnoId: string, override: Partial<ItemCarrito> = {}): ItemCarrito {
    return ItemCarritoMother.crear({
      alumnoId,
      id: `item-${alumnoId}`,
      ...override,
    });
  }
}

export class OrdenAlumnoMother {
  static crear(override: Partial<OrdenAlumno> = {}): OrdenAlumno {
    return {
      alumno: AlumnoMother.crear({ id: 'alumno-1', saldo: 5000 }),
      buffetId: 'buffet-1',
      items: [ItemCarritoMother.crear()],
      fecha: '2026-07-15',
      recreo: 'PRIMER_RECREO' as Recreo,
      subtotal: 500,
      ...override,
    };
  }

  static crearSinSaldo(override: Partial<OrdenAlumno> = {}): OrdenAlumno {
    return OrdenAlumnoMother.crear({
      alumno: AlumnoMother.crear({ id: 'alumno-sin-saldo', saldo: 100 }),
      subtotal: 1500,
      ...override,
    });
  }
}

export class OrdenCompraMother {
  static crear(override: Partial<OrdenCompra> = {}): OrdenCompra {
    const ordenes = override.ordenes ?? [OrdenAlumnoMother.crear()];
    const total = ordenes.reduce((acc, o) => acc + o.subtotal, 0);
    return {
      id: '',
      ordenes,
      total,
      codigos: {},
      ...override,
    };
  }

  static crearPagada(override: Partial<OrdenCompra> = {}): OrdenCompra {
    return OrdenCompraMother.crear({
      id: 'orden-pagada-1',
      codigos: { 'alumno-1': 'ABC123' },
      ...override,
    });
  }
}

export class SugerenciaCarritoMother {
  static crear(override: Partial<SugerenciaCarrito> = {}): SugerenciaCarrito {
    return {
      productId: 'prod-sug-1',
      productName: 'Agua',
      price: 300,
      stockActual: 10,
      reason: 'Se suele pedir con Alfajor',
      source: 'BUFFET_CART_AFFINITY',
      score: 0.85,
      ...override,
    };
  }
}
