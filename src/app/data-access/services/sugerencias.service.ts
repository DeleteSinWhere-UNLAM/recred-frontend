import { Injectable } from '@angular/core';

import { SugerenciaProducto }
from '../models/sugerencia-producto.model';

@Injectable({
  providedIn: 'root'
})
export class SugerenciasService {

  private readonly sugerencias:
    SugerenciaProducto[] = [

    {

      productoOriginal:
        'Paso de los Toros Pomelo 500ml',

      resumen:
        'Te sugiero una alternativa popular de gaseosa y revisar el precio actual del producto.',

      alertas: [
        'El precio actual parece extremadamente bajo.'
      ],

      productosSugeridos: [

        'Sprite Lima Limón 500ml',

        'Schweppes Pomelo 500ml'

      ],

      motivoIA:
        'Bajo consumo detectado durante las últimas semanas.',

      modeloIA:
        'gemini-2.5-flash'

    }

  ];

  getSugerencias():
    SugerenciaProducto[] {

    return this.sugerencias;

  }

}