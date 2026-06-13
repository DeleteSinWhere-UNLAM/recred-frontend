import { Injectable } from '@angular/core';

import { ResumenKiosquero } from '../models/resumen-kiosquero.model';

@Injectable({ providedIn: 'root' })
export class HomeKiosqueroService {
  getResumen(): ResumenKiosquero {
    return {
      gananciasHoy: 12450,
      ventasHoy: 34,
      productosSinStock: 5,
      pedidosPendientes: 8,
    };
  }

  getNombreKiosquero(): string {
    return 'Carlos';
  }
}
