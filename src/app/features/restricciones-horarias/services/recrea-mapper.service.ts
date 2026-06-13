import { Injectable } from '@angular/core';
import { Recreo } from '../../compra/models/orden-compra.model';

/**
 * Servicio que mapea entre tipos de Recreo (frontend) y timeSlotIds (backend)
 */
@Injectable({ providedIn: 'root' })
export class RecreaMapperService {
  /**
   * Mapea un tipo de Recreo a su timeSlotId correspondiente
   * Este mapeo debe coincidir con el backend (verificar con tu equipo de backend)
   */
  private readonly mapeoRecreaATimeSlot: Record<Recreo, string> = {
    PRIMER_RECREO: 'ts-001',
    SEGUNDO_RECREO: 'ts-002',
    MEDIODIA: 'ts-003',
    FUERA_HORA: 'ts-004',
  };

  /**
   * Mapeo inverso: de timeSlotId a tipo de Recreo
   */
  private readonly mapeoTimeSlotARecrea: Record<string, Recreo> = {
    'ts-001': 'PRIMER_RECREO',
    'ts-002': 'SEGUNDO_RECREO',
    'ts-003': 'MEDIODIA',
    'ts-004': 'FUERA_HORA',
  };

  /**
   * Convierte un Recreo a su timeSlotId
   */
  recreoATimeSlotId(recreo: Recreo): string {
    return this.mapeoRecreaATimeSlot[recreo];
  }

  /**
   * Convierte un timeSlotId a su Recreo correspondiente
   */
  timeSlotIdARecrea(timeSlotId: string): Recreo | null {
    return this.mapeoTimeSlotARecrea[timeSlotId] ?? null;
  }

  /**
   * Retorna todos los timeSlotIds mapeados
   */
  obtenerTodosLosTimeSlotIds(): string[] {
    return Object.values(this.mapeoRecreaATimeSlot);
  }
}
