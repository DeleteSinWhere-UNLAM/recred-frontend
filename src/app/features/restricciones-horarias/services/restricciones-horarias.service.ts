import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RestriccionHoraria, TimeRestrictionCommand } from '../models/restriccion-horaria.model';

@Injectable({ providedIn: 'root' })
export class RestriccionesHorariasService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl + '/time-restrictions';

  getRestriccionesPorAlumno(alumnoId: string): Promise<RestriccionHoraria[]> {
    const url = `${this.base}/student/${alumnoId}`;
    console.log('Obteniendo restricciones desde:', url);
    return firstValueFrom(
      this.http.get<RestriccionHoraria[]>(url),
    ).then(data => {
      console.log('Restricciones recibidas (RAW):', data);
      return data;
    }).catch(err => {
      console.error('Error al obtener restricciones del alumno:', err);
      throw err;
    });
  }

  crearRestriccion(command: TimeRestrictionCommand): Promise<RestriccionHoraria> {
    return firstValueFrom(
      this.http.post<RestriccionHoraria>(this.base, command),
    );
  }

  actualizarRestriccion(id: string, command: TimeRestrictionCommand): Promise<RestriccionHoraria> {
    return firstValueFrom(
      this.http.put<RestriccionHoraria>(`${this.base}/${id}`, command),
    );
  }

  deshabilitarRestriccion(id: string): Promise<void> {
    return firstValueFrom(
      this.http.patch<void>(`${this.base}/${id}/disable`, {}),
    );
  }
}
