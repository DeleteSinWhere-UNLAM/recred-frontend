import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ClasificacionSaludBackend {
  readonly id: string;
  readonly descripcion: string;
  readonly activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RestriccionesService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/v\d+\/?$/, '');

  getCatalogo(): Promise<ClasificacionSaludBackend[]> {
    return firstValueFrom(
      this.http.get<ClasificacionSaludBackend[]>(`${this.base}/clasificaciones-salud`),
    );
  }

  getRestriccionesAlumno(alumnoId: string): Promise<ClasificacionSaludBackend[]> {
    return firstValueFrom(
      this.http.get<ClasificacionSaludBackend[]>(
        `${this.base}/control-parental/alumnos/${alumnoId}/obtener-restricciones-salud`,
      ),
    );
  }

  actualizarRestricciones(alumnoId: string, clasificacionesIds: string[]): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(
        `${this.base}/control-parental/alumnos/${alumnoId}/actualizar-restricciones-salud`,
        { clasificacionesIds },
      ),
    );
  }
}
