import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Promotion {
  id: string;
  name: string;
  discountPercentage: number;
  productIds: string[];
  startDate: string;
  endDate: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/promotions`;

  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl);
  }

  approvePromotion(id: string): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.apiUrl}/${id}`, { status: 'ACTIVE' });
  }

  discardPromotion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
