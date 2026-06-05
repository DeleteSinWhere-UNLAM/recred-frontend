import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment'; // ajustá el path si hace falta
import { SpendingPrediction } from '../models/spending-prediction.interface';
import { PerfilService } from '../../../data-access/services/perfil.service';

@Injectable({
  providedIn: 'root',
})
export class SpendingPredictionService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);

  getPrediction(): Observable<SpendingPrediction> {
    const alumnoId = this.perfilService.perfil()?.id;

    if (!alumnoId) {
      throw new Error('No se encontró el ID del alumno en la sesión.');
    }

    return this.http.get<SpendingPrediction>(
      `${environment.apiUrl}/ia/alumnos/${alumnoId}/prediccion-gasto`,
    );
  }
}