import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpendingPrediction } from '../models/spending-prediction.interface';

@Injectable({
  providedIn: 'root',
})
export class SpendingPredictionService {
  private readonly http = inject(HttpClient);

  getPrediction(alumnoId: string): Observable<SpendingPrediction> {
    if (!alumnoId) {
      throw new Error(
        'No se encontró el ID del alumno para obtener la predicción.',
      );
    }

    return this.http.get<SpendingPrediction>(
      `${environment.apiUrl}/ia/alumnos/${alumnoId}/prediccion-gasto`,
    );
  }
}
