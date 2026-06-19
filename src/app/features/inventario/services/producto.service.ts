import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Producto } from '../models/producto.model';
import { CrearProductoRequest } from '../models/requests/crear-producto-request.model';
import { ActualizarProductoRequest } from '../models/requests/actualizar-producto-request.model';
import { Categoria } from '../models/categoria.model';
import {
  MovimientoStock,
  ActualizacionStockRequest,
  ItemInventario,
  AccionStockRapidaRequest,
} from '../models/inventario.model';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;
  private readonly inventoryUrl = `${environment.apiUrl}/inventory`;

  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl);
  }

  getCategories(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${environment.apiUrl}/categories`);
  }

  getAllByBuffetId(buffetId: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl, { params: { buffetId } });
  }

  getInventoryOverview(buffetId: string): Observable<ItemInventario[]> {
    return this.http.get<ItemInventario[]>(
      `${this.inventoryUrl}/${buffetId}/overview`,
    );
  }

  quickStockAction(
    buffetId: string,
    productId: string,
    payload: AccionStockRapidaRequest,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/quick-action`,
      payload,
    );
  }

  updateInventoryStock(
    buffetId: string,
    productId: string,
    payload: ActualizacionStockRequest,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/stock`,
      payload,
    );
  }

  getProductStockMovements(
    buffetId: string,
    productId: string,
  ): Observable<MovimientoStock[]> {
    return this.http.get<MovimientoStock[]>(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/movements`,
    );
  }

  getById(id: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`);
  }

  create(payload: CrearProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, payload);
  }

  createBulk(products: CrearProductoRequest[]): Observable<Producto[]> {
    return this.http.post<Producto[]>(`${this.baseUrl}/bulk`, products);
  }

  update(id: string, payload: ActualizarProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
