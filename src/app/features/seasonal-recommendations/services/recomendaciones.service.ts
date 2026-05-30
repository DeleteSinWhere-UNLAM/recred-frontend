import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecomendacionesResponse } from '../models/recomendacion.model';

@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://18-119-187-167.sslip.io/api/v1/recomendations/seasonal';

  getSeasonalRecommendations(lat: number, lng: number): Observable<RecomendacionesResponse> {
    const params = new HttpParams()
      .set('latitude', lat.toString())
      .set('longitude', lng.toString());

    return this.http.get<RecomendacionesResponse>(this.apiUrl, { params });
  }
}
