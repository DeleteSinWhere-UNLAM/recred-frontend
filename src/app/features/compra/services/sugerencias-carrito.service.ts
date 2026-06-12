import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SugerenciaCarrito,
  SugerenciaCarritoRequest,
} from '../models/sugerencia-carrito.model';

@Injectable({ providedIn: 'root' })
export class SugerenciasCarritoService {
  private readonly http = inject(HttpClient);

  obtenerSugerencias(
    request: SugerenciaCarritoRequest,
  ): Observable<SugerenciaCarrito[]> {
    return this.http.post<SugerenciaCarrito[]>(
      `${environment.apiUrl}/cart-suggestions`,
      request,
    );
  }
}
