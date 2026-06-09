import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.interface';
import { Category } from '../models/category.interface';
import {
  InventoryOverviewItem,
  QuickStockActionRequest,
} from '../models/inventory.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;
  private readonly inventoryUrl = `${environment.apiUrl}/inventory`;

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${environment.apiUrl}/categories`);
  }

  getAllByBuffetId(buffetId: string): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl, { params: { buffetId } });
  }

  getInventoryOverview(buffetId: string): Observable<InventoryOverviewItem[]> {
    return this.http.get<InventoryOverviewItem[]>(
      `${this.inventoryUrl}/${buffetId}/overview`,
    );
  }

  quickStockAction(
    buffetId: string,
    productId: string,
    payload: QuickStockActionRequest,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/quick-action`,
      payload,
    );
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
