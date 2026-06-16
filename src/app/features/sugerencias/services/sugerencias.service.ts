import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { SugerenciaProducto } from '../models/sugerencia-producto.model';
import { Product } from '../../updated-inventory/models/product.interface';

@Injectable({
  providedIn: 'root',
})
export class SugerenciasService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  getSugerencias(usuarioId: string): Observable<SugerenciaProducto[]> {
    return this.http.get<SugerenciaProducto[]>(
      `${this.baseUrl}/kiosqueros/${usuarioId}/lista-sugerencia-cambio-producto`,
    );
  }

  comprarSugerencia(sugerenciaId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/sugerencias-consumo/comprar`,

      { sugerenciaId },
    );
  }

  getComboSuggestions(productId: string, userId: string): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.baseUrl}/combo-suggestions/${productId}/${userId}`,
    );
  }
}
