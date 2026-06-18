import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Product } from '../models/product.interface';
import { CreateProductRequest } from '../models/requests/create-product-request.interface';
import { UpdateProductRequest } from '../models/requests/update-product-request.interface';
import { Category } from '../models/category.interface';
import {
  InventoryStockMovement,
  InventoryStockUpdateRequest,
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

  updateInventoryStock(
    buffetId: string,
    productId: string,
    payload: InventoryStockUpdateRequest,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/stock`,
      payload,
    );
  }

  getProductStockMovements(
    buffetId: string,
    productId: string,
  ): Observable<InventoryStockMovement[]> {
    return this.http.get<InventoryStockMovement[]>(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/movements`,
    );
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, payload);
  }

  createBulk(products: CreateProductRequest[]): Observable<Product[]> {
    return this.http.post<Product[]>(`${this.baseUrl}/bulk`, products);
  }

  update(id: string, payload: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
