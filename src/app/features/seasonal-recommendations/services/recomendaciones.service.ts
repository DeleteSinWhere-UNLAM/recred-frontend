import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RecomendacionesResponse } from '../models/recomendacion.model';

@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recomendations/seasonal`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSeasonalRecommendations(_lat: number, _lng: number): Observable<RecomendacionesResponse> {
    // Hardcoded response for testing
    return of({
      "sugerencias": [
        {
          "categoria": "Bebidas Calientes",
          "accion": "AUMENTAR",
          "motivo": "El clima fresco y nublado incrementa la demanda de infusiones calientes en el recreo."
        },
        {
          "categoria": "Panificados y Horneados",
          "accion": "AUMENTAR",
          "motivo": "Los productos horneados son altamente demandados como acompañamiento en días de bajas temperaturas."
        },
        {
          "categoria": "Helados y Congelados",
          "accion": "REDUCIR",
          "motivo": "La baja temperatura ambiental disminuye drásticamente el consumo de productos congelados."
        }
      ],
      "tip_promocional": "Ofrece un combo de leche chocolatada caliente con un alfajor o galletita horneada."
    }).pipe(delay(1500));
  }
}
