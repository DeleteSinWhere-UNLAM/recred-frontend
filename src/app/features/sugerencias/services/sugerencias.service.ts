import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SugerenciaProducto } from '../models/sugerencia-producto.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SugerenciasService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  getSugerencias(usuarioId: string): Observable<SugerenciaProducto[]> {
    return this.http
      .get<SugerenciaProducto>(
        `${this.baseUrl}/kiosqueros/${usuarioId}/sugerencia-cambio-producto`,
      )
      .pipe(map((response) => [response]));
  }
}
