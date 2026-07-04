import { Usuario } from '../../data-access/models/usuario.model';
import { SugerenciaProducto, ComboSuggestion } from './models/sugerencia-producto.model';
import { Producto } from '../inventario/models/producto.interface';

export class SugerenciasMother {
  static crearUsuario(override: Partial<Usuario> = {}): Usuario {
    return {
      id: 'test-id',
      nombre: 'Test User',
      ...override
    } as unknown as Usuario;
  }

  static crearSugerencia(override: Record<string, unknown> = {}): SugerenciaProducto {
    return {
      productoOriginal: 'Producto Base',
      estadisticasVenta: {
        productoId: 'p1',
        stockActual: 10,
        diasSinVenta: 5,
        ventasPeriodo: 100
      },
      alertas: [],
      ...override
    } as unknown as SugerenciaProducto;
  }

  static crearSugerencias(): SugerenciaProducto[] {
    return [
      this.crearSugerencia({
        productoOriginal: 'Producto 1',
        estadisticasVenta: { productoId: 'p1', stockActual: 10, diasSinVenta: 5, ventasPeriodo: 100 }
      }),
      this.crearSugerencia({
        productoOriginal: 'Producto 2',
        estadisticasVenta: { productoId: 'p2', stockActual: 20, diasSinVenta: 10, ventasPeriodo: 200 }
      })
    ];
  }

  static crearComboSuggestion(): ComboSuggestion {
    return {
      idProduct: 'p1',
      productName: 'Producto 1',
      suggestedProducts: [{ id: 'c1', nombre: 'Combo 1', precio: 100 }]
    };
  }

  static crearProducto(): Producto {
    return {
      id: 'p1',
      nombre: 'Producto 1',
      descripcion: 'Desc',
      precio: 100,
      peso: 1,
      requierePreparacion: false,
      stockActual: 10,
      urlImagen: 'http://image.url'
    } as unknown as Producto;
  }
}
