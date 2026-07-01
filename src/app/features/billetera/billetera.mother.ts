import {
  BilleteraResumen,
  DireccionMovimiento,
  MovimientoBilletera,
} from './models/billetera.model';

export interface AlumnoMock {
  id: string;
  nombre: string;
  apellido: string;
  grado: string;
  colegioId: string;
  saldo: number;
  urlFotoPerfil?: string;
}

export class BilleteraMother {
  static readonly ALUMNO_ID = 'alumno-1';
  static readonly DESDE = '2026-06-01';
  static readonly HASTA = '2026-06-14';

  static crearAlumno(override: Partial<AlumnoMock> = {}): AlumnoMock {
    return {
      id: BilleteraMother.ALUMNO_ID,
      nombre: 'Nombre',
      apellido: 'Apellido',
      grado: '4to',
      colegioId: 'col-1',
      saldo: 0,
      urlFotoPerfil: undefined,
      ...override,
    };
  }

  static crearMovimiento(override: Partial<MovimientoBilletera> = {}): MovimientoBilletera {
    return {
      id: 'mov-1',
      fechaHora: '2026-06-14T10:15:00',
      tipo: 'COMPRA',
      descripcion: 'Compra en buffet',
      monto: 450,
      direccion: 'SALIDA',
      ...override,
    };
  }

  static crearMovimientoConDireccion(direccion: DireccionMovimiento): MovimientoBilletera {
    return BilleteraMother.crearMovimiento({ direccion, monto: 100 });
  }

  static crearResumen(override: Partial<BilleteraResumen> = {}): BilleteraResumen {
    return {
      alumnoId: BilleteraMother.ALUMNO_ID,
      saldoActual: 0,
      periodo: { desde: BilleteraMother.DESDE, hasta: BilleteraMother.HASTA },
      montoIngresado: 0,
      montoGastado: 0,
      balancePeriodo: 0,
      cantidadCompras: 8,
      gastoPorCategoria: [],
      gastoPorClasificacionSalud: [],
      movimientos: [],
      ...override,
    };
  }
}
