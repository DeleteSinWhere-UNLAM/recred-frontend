import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AiProductResponse } from '../../models/ai-product-response.interface';
import { SaveProductRequest } from '../../models/save-product-request.interface';

@Injectable({
  providedIn: 'root',
})
export class AiVisionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/api\/v\d+\/?$/, '');
  private readonly uploadUrl = `${this.baseUrl}/api/load-stock/upload-image`;
  private readonly saveUrl = `${this.baseUrl}/api/load-stock/save-product`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  analyzeImage(_file: File): Observable<AiProductResponse> {
    // Hardcoded response for testing
    return of({
      nombre: 'Pepas Terepín',
      descripcion: 'Pepas de membrillo',
      peso: '0.200 kg',
      categoriaNombre: 'Galletita',
      contiene_azucar: true,
      contiene_mani: false,
      contiene_lactosa: false,
      contiene_tacc: true,
    }).pipe(delay(1500));
  }

  saveProduct(request: SaveProductRequest): Observable<unknown> {
    return this.http.post(this.saveUrl, request);
  }
}
