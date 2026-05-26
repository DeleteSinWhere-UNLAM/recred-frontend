import { Injectable } from '@angular/core';
import { SugerenciaProducto } from '../models/sugerencia-producto.model';

@Injectable({ providedIn: 'root' })
export class SugerenciasService {

  private readonly sugerencias: SugerenciaProducto[] = [
    {
      productoOriginal: 'Gaseosa',
      productoSugerido: 'Jugo',
      motivo: 'Producto bloqueado por adulto',
      bloqueado: true,
      disponible: true,
    },
    {
      productoOriginal: 'Chocolate',
      productoSugerido: 'Barra de cereal',
      motivo: 'Sugerencia saludable',
      bloqueado: false,
      disponible: true,
    }
  ];

  getSugerencias(): SugerenciaProducto[] {
    return this.sugerencias;
  }
}