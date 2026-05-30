import { Injectable } from '@angular/core';

import { ResumenVendedor } from '../models/resumen-vendedor.model';

@Injectable({
  providedIn: 'root',
})
export class VendedorHomeService {
  getResumen(): ResumenVendedor {
    return {
      gananciasHoy: 12450,

      ventasHoy: 34,

      productosSinStock: 5,

      alertasPendientes: 2,
    };
  }
}
