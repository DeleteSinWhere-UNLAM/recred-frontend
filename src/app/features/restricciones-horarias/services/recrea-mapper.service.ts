import { Injectable } from '@angular/core';
import { Recreo } from '../../compra/models/orden-compra.model';

@Injectable({ providedIn: 'root' })
export class RecreaMapperService {
  private readonly mapeoRecreaATimeSlot: Record<Recreo, string> = {
    PRIMER_RECREO: 'ts-001',
    SEGUNDO_RECREO: 'ts-002',
    MEDIODIA: 'ts-003',
    FUERA_HORA: 'ts-004',
  };

  private readonly mapeoTimeSlotARecrea: Record<string, Recreo> = {
    'ts-001': 'PRIMER_RECREO',
    'ts-002': 'SEGUNDO_RECREO',
    'ts-003': 'MEDIODIA',
    'ts-004': 'FUERA_HORA',
  };

  recreoATimeSlotId(recreo: Recreo): string {
    return this.mapeoRecreaATimeSlot[recreo];
  }

  timeSlotIdARecrea(timeSlotId: string): Recreo | null {
    return this.mapeoTimeSlotARecrea[timeSlotId] ?? null;
  }

  obtenerTodosLosTimeSlotIds(): string[] {
    return Object.values(this.mapeoRecreaATimeSlot);
  }
}
