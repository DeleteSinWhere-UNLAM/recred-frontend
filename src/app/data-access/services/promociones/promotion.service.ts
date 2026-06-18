import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../perfil.service';

export interface Promotion {
  id: string;
  name: string;
  discountPercentage: number;
  productIds: string[];
  startDate: string;
  endDate: string;
  status: string;
  buffetId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);
  private readonly apiUrl = `${environment.apiUrl}/promotions`;

  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/buffet/${this.perfilService.obtenerBuffetId()}`);
  }

  approvePromotion(id: string, buffetId: string): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.apiUrl}/${id}`, { status: 'ACTIVE', buffetId });
  }

  discardPromotion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createPromotion(promotion: Partial<Promotion>): Observable<Promotion> {
    const buffetId = promotion.buffetId ?? this.perfilService.obtenerBuffetId() ?? '';
    const payload = { ...promotion, buffetId };
    return this.http.post<Promotion>(this.apiUrl, payload);
  }
}
