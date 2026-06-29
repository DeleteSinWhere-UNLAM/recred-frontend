import { Usuario } from '../../data-access/models/usuario.model';
import { SugerenciaAgregarProducto } from './models/sugerencia-agregar.model';

export class SugerenciasAgregarMother {
  static crearUsuario(override: Partial<Usuario> = {}): Usuario {
    return {
      id: 'user-1',
      nombre: 'Test Kiosquero',
      rol: 'KIOSQUERO',
      ...override
    } as unknown as Usuario;
  }

  static crearSugerencia(override: Partial<SugerenciaAgregarProducto> = {}): SugerenciaAgregarProducto {
    return {
      id: '1',
      alumnoId: null,
      buffetId: 'b1',
      productoId: 'p1',
      titulo: 'Título por defecto',
      mensaje: 'Mensaje por defecto',
      metadata: {
        totalSales: 10,
        productName: 'Producto por defecto',
        productPrice: 100,
        totalRevenue: 1000,
        totalCustomers: 5
      },
      ...override
    };
  }

  static crearListaSugerencias(): SugerenciaAgregarProducto[] {
    return [
      this.crearSugerencia({
        id: '1',
        metadata: { totalSales: 10, productName: 'Prod A', productPrice: 100, totalRevenue: 1000, totalCustomers: 5 }
      }),
      this.crearSugerencia({
        id: '2',
        metadata: { totalSales: 20, productName: 'Prod B', productPrice: 50, totalRevenue: 1000, totalCustomers: 10 }
      }),
      this.crearSugerencia({
        id: '3',
        mensaje: 'Msg 3',
        metadata: { totalSales: 5, productName: 'Prod C', productPrice: 400, totalRevenue: 2000, totalCustomers: 2 }
      })
    ];
  }
}
