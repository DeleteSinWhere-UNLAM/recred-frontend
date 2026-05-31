import { Injectable } from '@angular/core';
import { PedidoEnCurso } from '../models/pedido-en-curso.model';
import { Recreo } from '../models/recreo.model';

@Injectable({ providedIn: 'root' })
export class HomeAlumnoService {
  private readonly pedidosMock: Record<string, PedidoEnCurso> = {
    'julian-garcia': {
      id: 'ped-001',
      estado: 'PREPARANDO',
      itemsResumen: ['Sándwich JyQ', 'Jugo de naranja'],
      totalFormateado: '$1.950',
      retiraEn: '10:30',
    },
  };

  private readonly recreosMock: Record<string, Recreo> = {
    'julian-garcia': { nombre: 'Recreo largo', horaInicio: '10:25', horaFin: '10:45' },
    'sofia-garcia': { nombre: 'Recreo corto', horaInicio: '11:30', horaFin: '11:40' },
    'mateo-garcia': { nombre: 'Recreo de mañana', horaInicio: '10:15', horaFin: '10:30' },
  };

  getPedidoEnCurso(alumnoId: string): PedidoEnCurso | undefined {
    return this.pedidosMock[alumnoId];
  }

  getProximoRecreo(alumnoId: string): Recreo | undefined {
    return this.recreosMock[alumnoId];
  }
}
