import { Injectable } from '@angular/core';
import { SugerenciaProducto } from '../models/sugerencia-producto.model';

@Injectable({ providedIn: 'root' })
export class SugerenciasService {
  private readonly sugerencias: SugerenciaProducto[] = [
    {
      productoOriginal: 'Gaseosa Cola 500ml',

      resumen: 'Te sugiero una alternativa más saludable.',

      alertas: ['Producto con bajo rendimiento', 'Consumo elevado de azúcar'],

      productosSugeridos: ['Jugo de Manzana 500ml', 'Agua mineral 500ml'],

      motivoIA: 'Producto bloqueado por alto consumo de azúcar detectado',

      modeloIA: 'gemini-2.5-flash',
    },

    {
      productoOriginal: 'Chocolate',

      resumen: 'Sugerencia de reemplazo más saludable',

      alertas: ['Sustitución recomendada'],

      productosSugeridos: ['Barra de cereal', 'Yogur con cereales'],

      motivoIA: 'Sugerencia saludable por patrón de consumo',

      modeloIA: 'gemini-2.5-flash',
    },
  ];

  getSugerencias(): SugerenciaProducto[] {
    return this.sugerencias;
  }
}
