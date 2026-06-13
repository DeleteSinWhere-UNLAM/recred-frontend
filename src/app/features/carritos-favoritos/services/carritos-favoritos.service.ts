import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CarritoFavoritoResponse, SaveCarritoFavoritoRequest } from '../models/carritos-favoritos.model';

@Injectable({ providedIn: 'root' })
export class CarritosFavoritosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/carritos-favoritos`;

  getCarritosFavoritos(alumnoId?: string, productoId?: string): Observable<CarritoFavoritoResponse[]> {
    let params = new HttpParams();
    if (alumnoId) {
      params = params.set('alumnoId', alumnoId);
    }
    if (productoId) {
      params = params.set('productoId', productoId);
    }
    return this.http.get<CarritoFavoritoResponse[]>(this.baseUrl, { params });
  }

  saveCarritoFavorito(request: SaveCarritoFavoritoRequest): Observable<CarritoFavoritoResponse> {
    return this.http.post<CarritoFavoritoResponse>(this.baseUrl, request);
  }

  deleteCarritoFavorito(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
