import { ConsumoAprendizaje } from './models/consumo-aprendizaje.model';

export class ConsumoAprendizajeMother {
  static crear(override: Partial<ConsumoAprendizaje> = {}): ConsumoAprendizaje {
    return {
      alumno: 'Julián García',
      productoFrecuente: 'Jugo',
      frecuencia: '4 veces por semana',
      recomendacion: 'Ofrecer jugos sin azúcar',
      ...override,
    };
  }

  static crearParaTostado(override: Partial<ConsumoAprendizaje> = {}): ConsumoAprendizaje {
    return ConsumoAprendizajeMother.crear({
      alumno: 'Sofía García',
      productoFrecuente: 'Tostado',
      frecuencia: '3 veces por semana',
      recomendacion: 'Agregar combos saludables',
      ...override,
    });
  }
}
