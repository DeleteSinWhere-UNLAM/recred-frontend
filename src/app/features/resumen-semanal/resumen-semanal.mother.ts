import { Usuario } from '../../data-access/models/usuario.model';
import { HijoResumen, MensajeHijo, ResumenSemanal } from './models/resumen-semanal.model';

export const USUARIO_ID_TEST = 'user-id-123';

export class UsuarioMother {
  static crear(override: Partial<Usuario> = {}): Usuario {
    return {
      id: USUARIO_ID_TEST,
      nombre: 'Test User',
      ...override,
    };
  }
}

export class HijoResumenMother {
  static crear(override: Partial<HijoResumen> = {}): HijoResumen {
    return {
      totalGastado: 1000,
      LimiteGasto: 2000,
      productoMasConsumido: { nombre: 'Alfajor', cantidad: 5, precio: 200 },
      porCategoria: { Snacks: 60, Bebidas: 40 },
      ...override,
    };
  }

  static crearSinCategorias(override: Partial<HijoResumen> = {}): HijoResumen {
    return HijoResumenMother.crear({
      totalGastado: 500,
      LimiteGasto: 1000,
      porCategoria: undefined as unknown as Record<string, number>,
      ...override,
    });
  }
}

export class MensajeHijoMother {
  static crear(override: Partial<MensajeHijo> = {}): MensajeHijo {
    return {
      nombre: 'Juan Perez',
      mensaje: 'Buen ahorro',
      ...override,
    };
  }
}

export class ResumenSemanalMother {
  static crear(override: Partial<ResumenSemanal> = {}): ResumenSemanal {
    return {
      id: '1',
      fechaDesde: '2023-01-01',
      fechaHasta: '2023-01-07',
      resumen: JSON.stringify({
        hijos: {
          'Juan Perez': HijoResumenMother.crear(),
          'Maria Lopez': HijoResumenMother.crearSinCategorias(),
        },
        mensaje: JSON.stringify([MensajeHijoMother.crear()]),
      }),
      ...override,
    };
  }

  static crearConMensajeNulo(): ResumenSemanal {
    return ResumenSemanalMother.crear({
      resumen: JSON.stringify({ hijos: {}, mensaje: null }),
    });
  }
}
