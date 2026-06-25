import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PayoutConfig } from '../models/payout-config.model';

@Injectable({ providedIn: 'root' })
export class PayoutConfigService {
  private readonly http = inject(HttpClient);

  obtenerConfiguracion(kiosqueroId: string): Promise<PayoutConfig> {
    return firstValueFrom(
      this.http.get<PayoutConfig>(
        `${environment.apiUrl}/kiosqueros/${kiosqueroId}/payout-config`,
      ),
    );
  }

  guardarConfiguracion(
    kiosqueroId: string,
    config: PayoutConfig,
  ): Promise<PayoutConfig> {
    return firstValueFrom(
      this.http.post<PayoutConfig>(
        `${environment.apiUrl}/kiosqueros/${kiosqueroId}/payout-config`,
        config,
      ),
    );
  }
}
