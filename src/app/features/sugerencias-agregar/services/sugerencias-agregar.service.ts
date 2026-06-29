import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SugerenciaAgregarProducto } from '../models/sugerencia-agregar.model';

@Injectable({
  providedIn: 'root',
})
export class SugerenciasAgregarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getSugerenciasAgregarProducto(): Observable<SugerenciaAgregarProducto[]> {
    return this.http.get<SugerenciaAgregarProducto[]>(
      `${this.baseUrl}/sugerencias/agregar-producto`,
    );
  }
}
