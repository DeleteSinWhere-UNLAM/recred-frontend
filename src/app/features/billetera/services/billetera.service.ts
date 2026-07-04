import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BilleteraResumen } from '../models/billetera.model';

@Injectable({ providedIn: 'root' })
export class BilleteraService {
  private readonly http = inject(HttpClient);

  getResumen(
    alumnoId: string,
    desde?: string,
    hasta?: string,
  ): Observable<BilleteraResumen> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    const url = `${environment.apiUrl}/wallets/students/${alumnoId}/summary`;
    return this.http.get<BilleteraResumen>(url, { params });
  }

  transferirSaldo(
    fromStudentId: string,
    toStudentId: string,
    amount: number,
  ): Observable<void> {
    const url = `${environment.apiUrl}/wallets/transfer`;
    return this.http.post<void>(url, { fromStudentId, toStudentId, amount });
  }
}
