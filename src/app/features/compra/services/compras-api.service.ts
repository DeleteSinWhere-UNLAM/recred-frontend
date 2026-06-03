import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type EstadoCompraBack =
  | 'PENDIENTE'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type BuyerType = 'TUTOR' | 'STUDENT';

export interface PurchaseItemDTO {
  productId: string;
  quantity: number;
}

export interface ProcessPurchaseRequestDTO {
  studentId: string;
  items: PurchaseItemDTO[];
}

export interface OrderRequest {
  studentId: string;
  buyerId: string;
  buyerType: BuyerType;
  date: string;
  recessTime: string;
  items: PurchaseItemDTO[];
}

export interface AdvancePurchaseRequest {
  orders: OrderRequest[];
}

export interface PurchaseResponseDTO {
  id: string;
  studentId: string;
  totalAmount: number;
  status: EstadoCompraBack | string;
  statusLabel?: string;
  paymentMethod?: string;
  date?: string;
  items?: PurchaseItemDTO[];
}

export interface AdvancePurchaseResponse {
  orderId: string;
  status: EstadoCompraBack | string | { value?: string };
  total: number;
  codes: Record<string, string>;
}

export interface PurchaseStatusResponseDTO {
  purchaseId: string;
  studentId: string;
  status: EstadoCompraBack | string;
  statusLabel: string;
  date: string;
}

export interface UpdatePurchaseStatusRequestDTO {
  status: EstadoCompraBack;
}

@Injectable({ providedIn: 'root' })
export class ComprasApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/purchases`;

  procesarPresencial(
    request: ProcessPurchaseRequestDTO,
  ): Observable<PurchaseResponseDTO> {
    return this.http.post<PurchaseResponseDTO>(
      `${this.base}/presential`,
      request,
    );
  }

  crearAnticipada(
    request: AdvancePurchaseRequest,
  ): Observable<AdvancePurchaseResponse> {
    return this.http.post<AdvancePurchaseResponse>(
      `${this.base}/advance`,
      request,
    );
  }

  obtener(id: string): Observable<PurchaseResponseDTO> {
    return this.http.get<PurchaseResponseDTO>(`${this.base}/${id}`);
  }

  obtenerEstado(id: string): Observable<PurchaseStatusResponseDTO> {
    return this.http.get<PurchaseStatusResponseDTO>(`${this.base}/${id}/status`);
  }

  actualizarEstado(
    id: string,
    request: UpdatePurchaseStatusRequestDTO,
  ): Observable<PurchaseStatusResponseDTO> {
    return this.http.patch<PurchaseStatusResponseDTO>(
      `${this.base}/${id}/status`,
      request,
    );
  }

  cancelar(id: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/cancel`, {});
  }
}
