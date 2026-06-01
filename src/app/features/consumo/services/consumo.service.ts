import { Injectable } from '@angular/core';

import { ConsumoAprendizaje } from '../models/consumo-aprendizaje.model';

@Injectable({ providedIn: 'root' })
export class ConsumoService {

  private readonly consumos: ConsumoAprendizaje[] = [
    {
      alumno: 'Julián García',
      productoFrecuente: 'Jugo',
      frecuencia: '4 veces por semana',
      recomendacion: 'Ofrecer jugos sin azúcar',
    },
    {
      alumno: 'Sofía García',
      productoFrecuente: 'Tostado',
      frecuencia: '3 veces por semana',
      recomendacion: 'Agregar combos saludables',
    }
  ];

  getConsumos(): ConsumoAprendizaje[] {
    return this.consumos;
  }

}