import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AiProductResponse } from '../../models/ai-product-response.interface';
import { SaveProductRequest } from '../../models/save-product-request.interface';

@Injectable({
  providedIn: 'root',
})
export class AiVisionService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl;
  private readonly uploadUrl = `${this.apiBase}/load-stock/upload-image`;
  private readonly saveUrl = `${this.apiBase}/load-stock/save-product`;

  analyzeImage(file: File): Observable<AiProductResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<AiProductResponse>(this.uploadUrl, formData);
  }

  saveProduct(request: SaveProductRequest): Observable<unknown> {
    return this.http.post(this.saveUrl, request);
  }
}
