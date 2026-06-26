import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RespuestaProductoIa } from '../../models/producto-ia-response.interface';
import { SolicitudGuardarProducto } from '../../models/guardar-producto-request.interface';

@Injectable({
  providedIn: 'root',
})
export class IaVisionService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl;
  private readonly uploadUrl = `${this.apiBase}/load-stock/upload-image`;
  private readonly saveUrl = `${this.apiBase}/load-stock/save-product`;

  analyzeImage(file: File): Observable<RespuestaProductoIa> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<RespuestaProductoIa>(this.uploadUrl, formData);
  }

  saveProduct(request: SolicitudGuardarProducto): Observable<unknown> {
    return this.http.post(this.saveUrl, request);
  }
}
