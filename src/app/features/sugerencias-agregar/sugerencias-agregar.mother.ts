import { Usuario } from '../../data-access/models/usuario.model';
import {
  SugerenciaAgregarMetadata,
  SugerenciaAgregarProducto,
} from './models/sugerencia-agregar.model';

export const USUARIO_ID_TEST = 'user-1';

export class UsuarioMother {
  static crear(override: Partial<Usuario> = {}): Usuario {
    return {
      id: USUARIO_ID_TEST,
      nombre: 'Test Kiosquero',
      ...override,
    };
  }
}

export class SugerenciaAgregarMetadataMother {
  static crear(override: Partial<SugerenciaAgregarMetadata> = {}): SugerenciaAgregarMetadata {
    return {
      totalSales: 10,
      productName: 'Producto por defecto',
      productPrice: 100,
      totalRevenue: 1000,
      totalCustomers: 5,
      ...override,
    };
  }
}

export class SugerenciaAgregarProductoMother {
  static crear(override: Partial<SugerenciaAgregarProducto> = {}): SugerenciaAgregarProducto {
    return {
      id: '1',
      alumnoId: null,
      buffetId: 'b1',
      productoId: 'p1',
      titulo: 'Título por defecto',
      mensaje: 'Mensaje por defecto',
      metadata: SugerenciaAgregarMetadataMother.crear(),
      ...override,
    };
  }

  static crearVarias(): SugerenciaAgregarProducto[] {
    return [
      SugerenciaAgregarProductoMother.crear({
        id: '1',
        metadata: SugerenciaAgregarMetadataMother.crear({
          totalSales: 10,
          productName: 'Prod A',
          productPrice: 100,
          totalRevenue: 1000,
          totalCustomers: 5,
        }),
      }),
      SugerenciaAgregarProductoMother.crear({
        id: '2',
        metadata: SugerenciaAgregarMetadataMother.crear({
          totalSales: 20,
          productName: 'Prod B',
          productPrice: 50,
          totalRevenue: 1000,
          totalCustomers: 10,
        }),
      }),
      SugerenciaAgregarProductoMother.crear({
        id: '3',
        mensaje: 'Msg 3',
        metadata: SugerenciaAgregarMetadataMother.crear({
          totalSales: 5,
          productName: 'Prod C',
          productPrice: 400,
          totalRevenue: 2000,
          totalCustomers: 2,
        }),
      }),
    ];
  }
}
