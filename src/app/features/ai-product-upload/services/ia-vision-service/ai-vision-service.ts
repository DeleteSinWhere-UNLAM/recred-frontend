import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiProductResponse } from '../../models/ai-product-response.interface';
import { SaveProductRequest } from '../../models/save-product-request.interface';

@Injectable({
  providedIn: 'root',
})
export class AiVisionService {
  private readonly http = inject(HttpClient);
  private readonly uploadUrl = 'http://localhost:8080/api/load-stock/upload-image';
  private readonly saveUrl = 'http://localhost:8080/api/load-stock/save-product';

  analyzeImage(file: File): Observable<AiProductResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<AiProductResponse>(this.uploadUrl, formData);
  }

  saveProduct(request: SaveProductRequest): Observable<unknown> {
    return this.http.post(this.saveUrl, request);
  }
}
