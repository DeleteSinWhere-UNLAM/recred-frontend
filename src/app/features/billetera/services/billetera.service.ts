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
}
