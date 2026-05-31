import { Injectable } from '@angular/core';

import { ResumenVendedor } from '../models/resumen-vendedor.model';

@Injectable({ providedIn: 'root' })
export class HomeVendedorService {
  getResumen(): ResumenVendedor {
    return {
      gananciasHoy: 12450,
      ventasHoy: 34,
      productosSinStock: 5,
    };
  }

  getNombreVendedor(): string {
    return 'Carlos';
  }
}
