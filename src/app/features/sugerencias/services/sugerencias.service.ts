import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SugerenciaProducto } from '../models/sugerencia-producto.model';

@Injectable({ providedIn: 'root' })
export class SugerenciasService {
  private readonly baseUrl = 'https://18-119-187-167.sslip.io';

  constructor(private readonly http: HttpClient) {}

  getSugerencias(usuarioId: string): Observable<SugerenciaProducto[]> {
    return this.http
      .get<SugerenciaProducto>(
        `https://18-119-187-167.sslip.io/ia/usuarios/ba5d1b87-8602-42ea-a75d-30debf41f1da/sugerencia-cambio-producto`,
      )
      .pipe(map((response) => [response]));
  }
}
