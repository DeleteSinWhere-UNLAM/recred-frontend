import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpendingPrediction } from '../models/spending-prediction.interface';
import { PerfilService } from '../../../data-access/services/perfil.service';

@Injectable({
  providedIn: 'root'
})
export class SpendingPredictionService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);

  getPrediction(): Observable<SpendingPrediction> {
    const alumnoId = this.perfilService.perfil()?.id;
    const rocioId = '345c0add-4188-489f-a290-bf1ab68b260a';
    if (!alumnoId) {
      throw new Error('No se encontró el ID del alumno en la sesión.');
    }
    return this.http.get<SpendingPrediction>(`https://18-119-187-167.sslip.io/ia/alumnos/${rocioId}/prediccion-gasto`);
  }


}

