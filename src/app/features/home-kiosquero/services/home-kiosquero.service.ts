import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { PanelKiosquero } from '../models/panel-kiosquero.model';
import { ResumenKiosquero } from '../models/resumen-kiosquero.model';

export interface DashboardRangeParams {
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class HomeKiosqueroService {
  private readonly http = inject(HttpClient);
  private readonly kiosquerosUrl = `${environment.apiUrl}/kiosqueros`;

  getPanel(buffetId: string, date?: string): Observable<PanelKiosquero> {
    return this.http.get<PanelKiosquero>(
      `${this.kiosquerosUrl}/${buffetId}/dashboard`,
      { params: this.buildDateParams(date) },
    );
  }

  getPanelByRange(
    buffetId: string,
    range: DashboardRangeParams,
  ): Observable<PanelKiosquero> {
    return this.http.get<PanelKiosquero>(
      `${this.kiosquerosUrl}/${buffetId}/dashboard`,
      { params: this.buildRangeParams(range) },
    );
  }

  getResumen(): ResumenKiosquero {
    return {
      gananciasHoy: 12450,
      ventasHoy: 34,
      productosSinStock: 5,
      pedidosPendientes: 8,
    };
  }

  getNombreKiosquero(): string {
    return 'Carlos';
  }

  private buildDateParams(date?: string): HttpParams {
    const params = new HttpParams();

    return date ? params.set('date', date) : params;
  }

  private buildRangeParams(range: DashboardRangeParams): HttpParams {
    return new HttpParams().set('from', range.from).set('to', range.to);
  }
}
