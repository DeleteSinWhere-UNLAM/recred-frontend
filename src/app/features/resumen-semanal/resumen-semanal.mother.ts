import { Usuario } from '../../data-access/models/usuario.model';
import { HijoResumen, MensajeHijo, ResumenSemanal } from './models/resumen-semanal.model';

export class ResumenSemanalMother {
  static crearUsuario(override: Partial<Usuario> = {}): Usuario {
    return {
      id: 'user-id-123',
      nombre: 'Test User',
      ...override
    } as unknown as Usuario;
  }

  static crearResumen(override: Partial<ResumenSemanal> = {}): ResumenSemanal {
    return {
      id: '1',
      fechaDesde: '2023-01-01',
      fechaHasta: '2023-01-07',
      resumen: JSON.stringify({
        hijos: {
          'Juan Perez': this.crearHijoResumen(),
          'Maria Lopez': this.crearHijoResumen({ totalGastado: 500, LimiteGasto: 1000, porCategoria: undefined })
        },
        mensaje: JSON.stringify([this.crearMensajeHijo()])
      }),
      ...override
    } as unknown as ResumenSemanal;
  }

  static crearHijoResumen(override: Partial<HijoResumen> = {}): HijoResumen {
    return {
      totalGastado: 1000,
      LimiteGasto: 2000,
      productoMasConsumido: { nombre: 'Alfajor', cantidad: 5, porcentaje: 10 },
      porCategoria: { Snacks: 60, Bebidas: 40 },
      ...override
    } as unknown as HijoResumen;
  }

  static crearMensajeHijo(override: Partial<MensajeHijo> = {}): MensajeHijo {
    return {
      nombre: 'Juan Perez',
      mensaje: 'Buen ahorro',
      ...override
    } as unknown as MensajeHijo;
  }
}
