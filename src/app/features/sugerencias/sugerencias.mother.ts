import { Usuario } from '../../data-access/models/usuario.model';
import { Producto } from '../inventario/models/producto.interface';
import {
  ComboSuggestion,
  EstadisticasVenta,
  SuggestedProduct,
  SugerenciaProducto,
} from './models/sugerencia-producto.model';

export const USUARIO_ID_TEST = 'test-id';

export class UsuarioMother {
  static crear(override: Partial<Usuario> = {}): Usuario {
    return {
      id: USUARIO_ID_TEST,
      nombre: 'Test User',
      ...override,
    };
  }
}

export class EstadisticasVentaMother {
  static crear(override: Partial<EstadisticasVenta> = {}): EstadisticasVenta {
    return {
      productoId: 'p1',
      nombre: 'Producto 1',
      categoria: 'Snacks',
      precioActual: 100,
      ventasPeriodo: 100,
      participacionVentas: 10,
      rankingGeneral: 1,
      rankingCategoria: 1,
      promedioVentasCategoria: 50,
      promedioPrecioCategoria: 90,
      diferenciaPrecioCategoria: 10,
      diasSinVenta: 5,
      clientesDistintos: 3,
      stockActual: 10,
      stockPromedioCategoria: 12,
      ...override,
    };
  }
}

export class SugerenciaProductoMother {
  static crear(override: Partial<SugerenciaProducto> = {}): SugerenciaProducto {
    return {
      productoOriginal: 'Producto Base',
      resumen: 'Bajó su rotación',
      alertas: [],
      productosSugeridos: [],
      motivoIA: 'motivo test',
      modeloIA: 'gpt-x',
      estadisticasVenta: EstadisticasVentaMother.crear(),
      ...override,
    };
  }

  static crearVarias(): SugerenciaProducto[] {
    return [
      SugerenciaProductoMother.crear({
        productoOriginal: 'Producto 1',
        estadisticasVenta: EstadisticasVentaMother.crear({
          productoId: 'p1',
          stockActual: 10,
          diasSinVenta: 5,
          ventasPeriodo: 100,
        }),
      }),
      SugerenciaProductoMother.crear({
        productoOriginal: 'Producto 2',
        estadisticasVenta: EstadisticasVentaMother.crear({
          productoId: 'p2',
          stockActual: 20,
          diasSinVenta: 10,
          ventasPeriodo: 200,
        }),
      }),
    ];
  }
}

export class SuggestedProductMother {
  static crear(override: Partial<SuggestedProduct> = {}): SuggestedProduct {
    return {
      id: 'c1',
      nombre: 'Combo 1',
      precio: 100,
      ...override,
    };
  }
}

export class ComboSuggestionMother {
  static crear(override: Partial<ComboSuggestion> = {}): ComboSuggestion {
    return {
      idProduct: 'p1',
      productName: 'Producto 1',
      suggestedProducts: [SuggestedProductMother.crear()],
      ...override,
    };
  }
}

export class ProductoMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: 'p1',
      nombre: 'Producto 1',
      descripcion: 'Desc',
      precio: 100,
      peso: 1,
      requierePreparacion: false,
      stockActual: 10,
      urlImagen: 'http://image.url',
      ...override,
    };
  }
}
