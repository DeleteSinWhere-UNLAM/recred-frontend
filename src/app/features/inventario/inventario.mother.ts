import { Categoria } from './models/categoria.interface';
import {
  ItemResumenInventario,
  MovimientoStockInventario,
  SolicitudAccionRapidaStock,
  SolicitudActualizarStockInventario,
} from './models/inventario.interface';
import { Producto } from './models/producto.interface';
import { SolicitudActualizarProducto } from './models/requests/actualizar-producto-request.interface';
import { SolicitudCrearProducto } from './models/requests/crear-producto-request.interface';
import {
  RespuestaCargaMasiva,
  RespuestaProductoMasivo,
} from './services/carga-masiva.service';

export const BUFFET_ID_TEST = 'buffet-1';
export const PRODUCTO_ID_TEST = 'producto-1';

export class ProductoInventarioMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: PRODUCTO_ID_TEST,
      nombre: 'Alfajor',
      descripcion: 'Alfajor de chocolate',
      precio: 500,
      peso: 55,
      requierePreparacion: false,
      stockActual: 10,
      categoriaId: 'cat-1',
      categoria: { id: 'cat-1', descripcion: 'Golosinas' },
      clasificacionesSalud: [],
      ...override,
    };
  }

  static crearRequierePreparacion(): Producto {
    return ProductoInventarioMother.crear({
      id: 'producto-2',
      nombre: 'Tostado',
      requierePreparacion: true,
      peso: 120,
    });
  }
}

export class CategoriaInventarioMother {
  static crear(override: Partial<Categoria> = {}): Categoria {
    return {
      id: 'cat-1',
      descripcion: 'Golosinas',
      activo: true,
      ...override,
    };
  }

  static crearInactiva(): Categoria {
    return CategoriaInventarioMother.crear({ id: 'cat-inactiva', activo: false });
  }
}

export class ItemResumenInventarioMother {
  static crear(override: Partial<ItemResumenInventario> = {}): ItemResumenInventario {
    return {
      productId: PRODUCTO_ID_TEST,
      nombre: 'Alfajor',
      precio: 500,
      urlImagen: null,
      tipoManejoInventario: 'STOCK_EXACTO',
      estadoInventario: 'DISPONIBLE',
      stockActual: 10,
      stockReservado: 2,
      stockDisponible: 8,
      stockMinimo: 3,
      cupoMaximoDiario: null,
      cupoDisponibleDia: null,
      disponible: true,
      bajoStock: false,
      agotado: false,
      ...override,
    };
  }

  static crearBajoStock(): ItemResumenInventario {
    return ItemResumenInventarioMother.crear({
      estadoInventario: 'BAJO_STOCK',
      stockActual: 2,
      stockDisponible: 2,
      stockMinimo: 5,
      bajoStock: true,
    });
  }

  static crearAgotado(): ItemResumenInventario {
    return ItemResumenInventarioMother.crear({
      estadoInventario: 'SIN_STOCK',
      stockActual: 0,
      stockDisponible: 0,
      agotado: true,
    });
  }
}

export class MovimientoStockInventarioMother {
  static crear(override: Partial<MovimientoStockInventario> = {}): MovimientoStockInventario {
    return {
      id: 'mov-1',
      inventarioId: 'inv-1',
      tipo: 'VENTA',
      cantidad: 2,
      cantidadAnterior: 10,
      cantidadNueva: 8,
      motivo: 'Consumo por venta presencial',
      usuarioId: 'usuario-1',
      compraId: 'compra-1',
      creadoEn: '2026-06-11T10:30:00',
      ...override,
    };
  }
}

export class SolicitudCrearProductoMother {
  static crear(override: Partial<SolicitudCrearProducto> = {}): SolicitudCrearProducto {
    return {
      nombre: 'Nuevo Producto',
      descripcion: 'Descripcion',
      precio: 500,
      peso: 100,
      requierePreparacion: false,
      categoriaId: 'cat-1',
      nuevaCategoriaNombre: '',
      buffetId: BUFFET_ID_TEST,
      stockActual: 10,
      clasificacionesSaludIds: [],
      tiposIds: null,
      ...override,
    };
  }
}

export class SolicitudActualizarProductoMother {
  static crear(override: Partial<SolicitudActualizarProducto> = {}): SolicitudActualizarProducto {
    return {
      nombre: 'Actualizado',
      descripcion: 'Descripcion actualizada',
      precio: 600,
      peso: 120,
      requierePreparacion: false,
      stockActual: 15,
      buffetId: BUFFET_ID_TEST,
      categoriaId: 'cat-1',
      clasificacionesSaludIds: [],
      ...override,
    };
  }
}

export class SolicitudActualizarStockInventarioMother {
  static crear(override: Partial<SolicitudActualizarStockInventario> = {}): SolicitudActualizarStockInventario {
    return {
      tipoManejoInventario: 'STOCK_EXACTO',
      stockActual: 15,
      stockMinimo: 5,
      estadoInventario: 'DISPONIBLE',
      disponible: true,
      motivo: 'Reponer stock',
      ...override,
    };
  }
}

export class SolicitudAccionRapidaStockMother {
  static crearAddStock(override: Partial<SolicitudAccionRapidaStock> = {}): SolicitudAccionRapidaStock {
    return {
      action: 'ADD_STOCK',
      quantity: 10,
      motivo: 'Reposicion',
      ...override,
    };
  }

  static crearMarcarAgotado(): SolicitudAccionRapidaStock {
    return { action: 'MARK_SOLD_OUT', motivo: 'Se acabo el stock' };
  }
}

export class RespuestaProductoMasivoMother {
  static crear(override: Partial<RespuestaProductoMasivo> = {}): RespuestaProductoMasivo {
    return {
      nombre: 'Agua Mineral',
      descripcion: 'Botella individual',
      precio: 600.0,
      peso: 500.0,
      requierePreparacion: false,
      categoriaId: null,
      nuevaCategoriaNombre: 'Bebidas',
      stockActual: 50,
      saludEtiquetasIds: [],
      tipoEtiquetasIds: [],
      ...override,
    };
  }
}

export class RespuestaCargaMasivaMother {
  static crear(override: Partial<RespuestaCargaMasiva> = {}): RespuestaCargaMasiva {
    return {
      products: [RespuestaProductoMasivoMother.crear()],
      ...override,
    };
  }
}
