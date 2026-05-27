import { Injectable } from '@angular/core';

import { HabitoAlerta } from '../models/habito-alerta.model';

@Injectable({ providedIn: 'root' })
export class HabitosService {

  private readonly alertas: HabitoAlerta[] = [
    {
      alumno: 'Julián García',
      categoria: 'Golosinas',
      porcentajeGasto: 40,
      mensaje: 'Tu hijo gasta 40% en golosinas',
      sugerencia: '¿Deseas limitar este tipo de productos?',
    },
        {
      alumno: 'Juliána García',
      categoria: 'Bebidas',
      porcentajeGasto: 90,
      mensaje: 'Tu hijo gasta 90% en bebidas alcohólicas',
      sugerencia: '¿Deseas limitar este tipo de productos?',
    }
  ];

  getAlertas(): HabitoAlerta[] {
    return this.alertas;
  }

}