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

export type DashboardView = 'home' | 'dashboard';

@Injectable({ providedIn: 'root' })
export class HomeKiosqueroService {
  private readonly http = inject(HttpClient);
  private readonly kiosquerosUrl = `${environment.apiUrl}/kiosqueros`;

  getPanel(
    buffetId: string,
    date?: string,
    view?: DashboardView,
  ): Observable<PanelKiosquero> {
    return this.http.get<PanelKiosquero>(
      `${this.kiosquerosUrl}/${buffetId}/dashboard`,
      { params: this.buildDateParams(date, view) },
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

  private buildDateParams(date?: string, view?: DashboardView): HttpParams {
    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    if (view) {
      params = params.set('view', view);
    }

    return params;
  }

  private buildRangeParams(range: DashboardRangeParams): HttpParams {
    return new HttpParams().set('from', range.from).set('to', range.to);
  }
}
