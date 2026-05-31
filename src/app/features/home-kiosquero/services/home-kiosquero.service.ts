import { Injectable } from '@angular/core';

import { ResumenKiosquero } from '../models/resumen-kiosquero.model';

@Injectable({ providedIn: 'root' })
export class HomeKiosqueroService {
  getResumen(): ResumenKiosquero {
    return {
      gananciasHoy: 12450,
      ventasHoy: 34,
      productosSinStock: 5,
    };
  }

  getNombreKiosquero(): string {
    return 'Carlos';
  }
}
