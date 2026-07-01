import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ScheduledPickup, EstadoCompra, EstadoRetiro } from '../models/tracking-pedidos.model';

@Injectable({
  providedIn: 'root',
})
export class TrackingPedidosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getScheduledPickups(filters?: {
    fecha?: string;
    status?: EstadoCompra;
    estadoRetiro?: EstadoRetiro;
    franjaId?: string;
    search?: string;
  }): Observable<ScheduledPickup[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.fecha) {
        params = params.set('fecha', filters.fecha);
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.estadoRetiro) {
        params = params.set('estadoRetiro', filters.estadoRetiro);
      }
      if (filters.franjaId) {
        params = params.set('franjaId', filters.franjaId);
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
    }

    return this.http.get<ScheduledPickup[]>(`${this.baseUrl}/buffet/scheduled-pickups`, {
      params,
    });
  }

  advanceOrderStatus(orderId: string, nextStatus: EstadoCompra): Observable<unknown> {
    return this.http.patch<unknown>(`${this.baseUrl}/purchases/${orderId}/status`, {
      status: nextStatus,
    });
  }

  cancelOrder(orderId: string): Observable<unknown> {
    return this.http.put<unknown>(`${this.baseUrl}/purchases/${orderId}/cancel`, {});
  }
}
