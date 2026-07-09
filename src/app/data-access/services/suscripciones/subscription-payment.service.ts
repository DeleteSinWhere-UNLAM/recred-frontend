import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type PlanSuscripcionUsuario = 'INTERMEDIO' | 'AVANZADO';
export type PeriodoSuscripcion = 'MENSUAL' | 'ANUAL';

export interface CrearSuscripcionUsuarioRequest {
  usuarioId: string;
  plan: PlanSuscripcionUsuario;
  periodo: PeriodoSuscripcion;
}

export interface CrearSuscripcionUsuarioResponse {
  paymentUrl: string;
  plan: PlanSuscripcionUsuario;
  periodo: PeriodoSuscripcion;
  price: number;
  currency: string;
}

export interface CrearPagoSuscripcionColegioRequest {
  colegioId: string;
}

export interface CrearPagoSuscripcionColegioResponse {
  paymentUrl: string;
  price: number;
  currency: string;
  checkoutUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionPaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl;

  crearSuscripcionUsuario(
    request: CrearSuscripcionUsuarioRequest,
  ): Promise<CrearSuscripcionUsuarioResponse> {
    return firstValueFrom(
      this.http.post<CrearSuscripcionUsuarioResponse>(
        `${this.apiBase}/payments/subscriptions/user`,
        request,
      ),
    );
  }

  crearPagoSuscripcionColegio(
    request: CrearPagoSuscripcionColegioRequest,
  ): Promise<CrearPagoSuscripcionColegioResponse> {
    return firstValueFrom(
      this.http.post<CrearPagoSuscripcionColegioResponse>(
        `${this.apiBase}/payments/subscriptions/school`,
        request,
      ),
    );
  }

  activarPruebaUsuario(request: {
    usuarioId: string;
    plan: PlanSuscripcionUsuario;
  }): Promise<unknown> {
    return firstValueFrom(
      this.http.post<unknown>(
        `${this.apiBase}/payments/subscriptions/user/trial`,
        request,
      ),
    );
  }
}
