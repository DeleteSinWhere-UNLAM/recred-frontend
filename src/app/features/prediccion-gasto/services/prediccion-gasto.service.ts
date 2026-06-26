import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PrediccionGasto } from '../models/prediccion-gasto.interface';

@Injectable({
  providedIn: 'root',
})
export class PrediccionGastoService {
  private readonly http = inject(HttpClient);

  getPrediction(alumnoId: string): Observable<PrediccionGasto> {
    if (!alumnoId) {
      throw new Error(
        'No se encontró el ID del alumno para obtener la predicción.',
      );
    }

    return this.http.get<PrediccionGasto>(
      `${environment.apiUrl}/ia/alumnos/${alumnoId}/prediccion-gasto`,
    );
  }
}
