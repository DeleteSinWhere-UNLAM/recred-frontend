import { HabitoAlerta } from './models/habito-alerta.model';

export class HabitoAlertaMother {
  static crear(override: Partial<HabitoAlerta> = {}): HabitoAlerta {
    return {
      alumno: 'Julián García',
      categoria: 'Golosinas',
      porcentajeGasto: 40,
      mensaje: 'Tu hijo gasta 40% en golosinas',
      sugerencia: '¿Deseas limitar este tipo de productos?',
      ...override,
    };
  }

  static crearParaBebidas(override: Partial<HabitoAlerta> = {}): HabitoAlerta {
    return HabitoAlertaMother.crear({
      alumno: 'Sofía García',
      categoria: 'Bebidas',
      porcentajeGasto: 65,
      mensaje: 'Tu hija gasta 65% en bebidas',
      sugerencia: '¿Querés fomentar el consumo de agua?',
      ...override,
    });
  }
}
