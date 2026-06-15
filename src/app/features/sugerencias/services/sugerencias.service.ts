import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { SugerenciaProducto } from '../models/sugerencia-producto.model';

@Injectable({
  providedIn: 'root',
})
export class SugerenciasService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  getSugerencias(usuarioId: string): Observable<SugerenciaProducto[]> {
    return this.http
      .get<
        SugerenciaProducto[]
      >(`${this.baseUrl}/kiosqueros/${usuarioId}/sugerencia-cambio-producto`)
      .pipe(map((response) => response));
  }

  comprarSugerencia(sugerenciaId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/sugerencias-consumo/comprar`, {
      sugerenciaId,
    });
  }
}
