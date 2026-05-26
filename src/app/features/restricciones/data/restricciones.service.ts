import { Injectable } from '@angular/core';
import {
  RestriccionesNutricionales,
  restriccionesPorDefecto,
} from '../models/restricciones-nutricionales.model';

@Injectable({ providedIn: 'root' })
export class RestriccionesService {
  private readonly registros = new Map<string, RestriccionesNutricionales>();

  getRestricciones(alumnoId: string): RestriccionesNutricionales {
    return this.registros.get(alumnoId) ?? restriccionesPorDefecto(alumnoId);
  }

  guardar(restricciones: RestriccionesNutricionales): void {
    this.registros.set(restricciones.alumnoId, { ...restricciones });
    console.info('[RestriccionesService] guardado', restricciones);
  }
}
