import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RespuestaRecomendaciones } from '../models/recomendacion.model';

@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recomendations/seasonal`;

  getSeasonalRecommendations(lat: number, lng: number): Observable<RespuestaRecomendaciones> {
    const params = new HttpParams()
      .set('latitude', lat.toString())
      .set('longitude', lng.toString());

    return this.http.get<RespuestaRecomendaciones>(this.apiUrl, { params });
  }
}
