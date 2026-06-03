import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SugerenciaProducto } from '../models/sugerencia-producto.model';

@Injectable({ providedIn: 'root' })
export class SugerenciasService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'https://18-119-187-167.sslip.io';

  getSugerencias(usuarioId: string): Observable<SugerenciaProducto[]> {
    return this.http
      .get<SugerenciaProducto>(
        `${this.baseUrl}/ia/usuarios/${usuarioId}/sugerencia-cambio-producto`,
      )
      .pipe(map((response) => [response]));
  }
}
