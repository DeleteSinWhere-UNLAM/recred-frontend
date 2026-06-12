import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface TopupResponse {
  paymentUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AcreditarMercadoPagoService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl;

  async generarLinkPago(studentId: string, amount: number): Promise<string> {
    const body = {
      studentId,
      amount,
    };
    const response = await firstValueFrom(
      this.http.post<TopupResponse>(`${this.apiBase}/payments/topup`, body)
    );
    return response.paymentUrl;
  }
}
