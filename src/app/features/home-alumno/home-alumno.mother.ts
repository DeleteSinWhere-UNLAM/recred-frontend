import { Movimiento } from '../movimientos/models/movimiento.model';
import { TimeSlot } from '../restricciones-horarias/models/restriccion-horaria.model';
import { AccionRapida } from './models/accion-rapida.model';
import { PedidoEnCurso } from './models/pedido-en-curso.model';
import { Recreo } from './models/recreo.model';

export class MovimientoPendienteMother {
  static crear(override: Partial<Movimiento> = {}): Movimiento {
    return {
      id: 'compra-1',
      studentId: 'alumno-1',
      totalAmount: 1950,
      status: 'EN_PREPARACION',
      statusLabel: 'En preparacion',
      paymentMethod: 'DEBIT',
      date: '2026-06-22T08:00:00',
      items: [
        { productId: 'p1', productName: 'Sándwich JyQ', quantity: 1, unitPrice: 1500 },
        { productId: 'p2', productName: 'Jugo', quantity: 2, unitPrice: 225 },
      ],
      tipo: 'ANTICIPADA',
      pickupDate: '2026-06-22',
      pickupSlotStartTime: '10:30',
      ...override,
    };
  }
}

export class FranjaHorariaMother {
  static crear(override: Partial<TimeSlot> = {}): TimeSlot {
    return {
      id: '1',
      colegioId: 'col-1',
      descripcion: 'Primer recreo',
      horaInicio: '10:15:00',
      horaFin: '10:30:00',
      activo: true,
      ...override,
    };
  }

  static crearListaDelColegio(): TimeSlot[] {
    return [
      FranjaHorariaMother.crear({ id: '1', descripcion: 'Primer recreo', horaInicio: '10:15:00', horaFin: '10:30:00' }),
      FranjaHorariaMother.crear({ id: '2', descripcion: 'Mediodia', horaInicio: '13:00:00', horaFin: '13:30:00' }),
      FranjaHorariaMother.crear({ id: '3', descripcion: 'Segundo recreo', horaInicio: '11:30:00', horaFin: '11:50:00' }),
      FranjaHorariaMother.crear({ id: '4', descripcion: 'Recreo viejo', horaInicio: '09:00:00', horaFin: '09:10:00', activo: false }),
    ];
  }
}

export class PedidoEnCursoMother {
  static crear(override: Partial<PedidoEnCurso> = {}): PedidoEnCurso {
    return {
      id: 'pedido-1',
      estado: 'CONFIRMADO',
      itemsResumen: ['Sándwich JyQ'],
      totalFormateado: '$ 1500',
      retiraEn: '10:30',
      ...override,
    };
  }
}

export class RecreoMother {
  static crear(override: Partial<Recreo> = {}): Recreo {
    return {
      nombre: 'Primer recreo',
      horaInicio: '10:15',
      horaFin: '10:30',
      ...override,
    };
  }
}

export class AccionRapidaMother {
  static crearBuffet(override: Partial<AccionRapida> = {}): AccionRapida {
    return {
      id: 'buffet',
      label: 'Ir al buffet',
      descripcion: 'Hacé tu pedido',
      icono: 'fa-utensils',
      emoji: '🍔',
      color: 'menta',
      ruta: '/buffet',
      ...override,
    };
  }

  static crearFavoritos(override: Partial<AccionRapida> = {}): AccionRapida {
    return {
      id: 'favoritos',
      label: 'Mis favoritos',
      descripcion: 'Lo que más te gusta',
      icono: 'fa-heart',
      emoji: '❤️',
      color: 'melocoton',
      ruta: '/favoritos',
      ...override,
    };
  }
}
