import {
  BilleteraResumen,
  MovimientoBilletera,
} from '../billetera/models/billetera.model';
import { RecargaVM } from './presenter/acreditar-mercado-pago.presenter';

export interface TopupResponse {
  paymentUrl: string;
}

export class TopupResponseMother {
  static crear(override: Partial<TopupResponse> = {}): TopupResponse {
    return {
      paymentUrl: 'https://mercadopago.com/pagar',
      ...override,
    };
  }
}

export class MovimientoBilleteraMother {
  static crearEntrada(override: Partial<MovimientoBilletera> = {}): MovimientoBilletera {
    return {
      id: 'mov-entrada-1',
      fechaHora: '2026-06-29T10:00:00',
      tipo: 'CARGA',
      descripcion: 'Recarga por Mercado Pago',
      monto: 1500,
      direccion: 'ENTRADA',
      ...override,
    };
  }

  static crearSalida(override: Partial<MovimientoBilletera> = {}): MovimientoBilletera {
    return {
      id: 'mov-salida-1',
      fechaHora: '2026-06-29T11:00:00',
      tipo: 'COMPRA',
      descripcion: 'Compra en el buffet',
      monto: 500,
      direccion: 'SALIDA',
      ...override,
    };
  }
}

export class BilleteraResumenMother {
  static crear(override: Partial<BilleteraResumen> = {}): BilleteraResumen {
    return {
      alumnoId: 'alumno-id',
      saldoActual: 1000,
      periodo: { desde: '2026-06-01', hasta: '2026-06-30' },
      montoIngresado: 1500,
      montoGastado: 500,
      balancePeriodo: 1000,
      cantidadCompras: 1,
      gastoPorCategoria: [],
      gastoPorClasificacionSalud: [],
      movimientos: [],
      ...override,
    };
  }

  static crearVacio(): BilleteraResumen {
    return BilleteraResumenMother.crear({ movimientos: [] });
  }

  static crearConMovimientos(movimientos: MovimientoBilletera[]): BilleteraResumen {
    return BilleteraResumenMother.crear({ movimientos });
  }
}

export class RecargaVMMother {
  static crear(override: Partial<RecargaVM> = {}): RecargaVM {
    return {
      id: 'recarga-1',
      montoFormateado: '$1.500',
      fechaFormateada: '29 jun, 10:00',
      estado: 'APROBADO',
      ...override,
    };
  }
}
