import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Producto } from '../models/producto.interface';
import { SolicitudCrearProducto } from '../models/requests/crear-producto-request.interface';
import { SolicitudActualizarProducto } from '../models/requests/actualizar-producto-request.interface';
import { Categoria } from '../models/categoria.interface';
import {
  MovimientoStockInventario,
  SolicitudActualizarStockInventario,
  ItemResumenInventario,
  SolicitudAccionRapidaStock,
} from '../models/inventario.interface';

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

  getInventoryOverview(buffetId: string): Observable<ItemResumenInventario[]> {
    return this.http.get<ItemResumenInventario[]>(
      `${this.inventoryUrl}/${buffetId}/overview`,
    );
  }

  quickStockAction(
    buffetId: string,
    productId: string,
    payload: SolicitudAccionRapidaStock,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/quick-action`,
      payload,
    );
  }

  updateInventoryStock(
    buffetId: string,
    productId: string,
    payload: SolicitudActualizarStockInventario,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/stock`,
      payload,
    );
  }

  getProductStockMovements(
    buffetId: string,
    productId: string,
  ): Observable<MovimientoStockInventario[]> {
    return this.http.get<MovimientoStockInventario[]>(
      `${this.inventoryUrl}/${buffetId}/products/${productId}/movements`,
    );
  }

  getById(id: string, buffetId?: string | null): Observable<Producto> {
    const url = `${this.baseUrl}/${id}`;
    if (buffetId) {
      return this.http.get<Producto>(url, { params: { buffetId } });
    }

    return this.http.get<Producto>(url);
  }

  create(payload: SolicitudCrearProducto): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, payload);
  }

  createBulk(products: SolicitudCrearProducto[]): Observable<Producto[]> {
    return this.http.post<Producto[]>(`${this.baseUrl}/bulk`, products);
  }

  update(id: string, payload: SolicitudActualizarProducto): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
