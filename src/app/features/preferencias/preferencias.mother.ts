import { Preferencia } from './models/preferencia.model';

export const ALUMNO_ID_TEST = 'alumno-1';
export const FALLBACK_ALUMNO_ID = '7058aa34-c843-41ca-a8dc-27c496fa7413';

export class PreferenciaMother {
  static crear(override: Partial<Preferencia> = {}): Preferencia {
    return {
      titulo: 'Alfajor de chocolate',
      mensaje: 'Es el producto que mas consume en el buffet',
      productoId: 'prod-alfajor',
      razonIA: 'Compra recurrente los lunes y miercoles',
      ...override,
    };
  }

  static crearJugo(): Preferencia {
    return PreferenciaMother.crear({
      titulo: 'Jugo de naranja',
      mensaje: 'Complementa sus meriendas con jugos naturales',
      productoId: 'prod-jugo',
      razonIA: 'Aparece en el 80% de sus compras del recreo',
    });
  }
}
