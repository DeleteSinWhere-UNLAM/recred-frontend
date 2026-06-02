import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpendingPrediction } from '../models/spending-prediction.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpendingPredictionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/ia/alumnos';

  getPrediction(alumnoId: string): Observable<SpendingPrediction> {
    return this.http.get<SpendingPrediction>(`${this.baseUrl}/${alumnoId}/prediccion-gasto`);
  }
}
