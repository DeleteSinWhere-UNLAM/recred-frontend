import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SupplierRequest,
  SupplierResponse,
  ListaPrecioProveedorResponse,
  ItemListaPrecioProveedorResponse,
  RecomendacionProveedor
} from '../models/proveedores.interfaces';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/suppliers`;

  getSuppliers(): Observable<SupplierResponse[]> {
    return this.http.get<SupplierResponse[]>(this.baseUrl);
  }

  getSupplierById(id: string): Observable<SupplierResponse> {
    return this.http.get<SupplierResponse>(`${this.baseUrl}/${id}`);
  }

  createSupplier(request: SupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.baseUrl, request);
  }

  updateSupplier(id: string, request: SupplierRequest): Observable<SupplierResponse> {
    return this.http.put<SupplierResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  uploadPriceList(supplierId: string, file: File): Observable<ListaPrecioProveedorResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ListaPrecioProveedorResponse>(
      `${this.baseUrl}/${supplierId}/price-lists`,
      formData
    );
  }

  updateMapping(itemId: string, productoInventarioId: string | null): Observable<ItemListaPrecioProveedorResponse> {
    return this.http.patch<ItemListaPrecioProveedorResponse>(
      `${this.baseUrl}/price-list-items/${itemId}/mapping`,
      { productoInventarioId }
    );
  }

  getPurchaseRecommendations(productosIds: string[]): Observable<RecomendacionProveedor[]> {
    return this.http.post<RecomendacionProveedor[]>(
      `${this.baseUrl}/purchase-recommendations`,
      { productosIds }
    );
  }
}
