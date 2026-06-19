import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FiltrosHistorialCierreDiario,
  RegistroCierreDiario,
  ResultadoCierreDiario,
  EstadoCierreDiario,
  ReporteDiario,
} from '../models/cierre-diario.model';

@Injectable({ providedIn: 'root' })
export class CierreDiarioService {
  private readonly http = inject(HttpClient);
  private readonly kiosquerosUrl = `${environment.apiUrl}/kiosqueros`;
  private readonly inventoryUrl = `${environment.apiUrl}/inventory`;

  closeDaily(buffetId: string, date: string): Observable<ResultadoCierreDiario> {
    return this.http.post<ResultadoCierreDiario>(
      `${this.kiosquerosUrl}/${buffetId}/daily-close`,
      null,
      { params: this.buildDateParams(date) },
    );
  }

  getDailyReport(buffetId: string, date: string): Observable<ReporteDiario> {
    return this.http.get<ReporteDiario>(
      `${this.kiosquerosUrl}/${buffetId}/reports/daily`,
      { params: this.buildDateParams(date) },
    );
  }

  getDailyCloseStatus(
    buffetId: string,
    date?: string,
  ): Observable<EstadoCierreDiario> {
    return this.http.get<EstadoCierreDiario>(
      `${this.kiosquerosUrl}/${buffetId}/daily-close/status`,
      { params: this.buildDateParams(date) },
    );
  }

  getDailyCloses(
    buffetId: string,
    filters: FiltrosHistorialCierreDiario = {},
  ): Observable<RegistroCierreDiario[]> {
    let params = new HttpParams();

    if (filters.from) {
      params = params.set('from', filters.from);
    }

    if (filters.to) {
      params = params.set('to', filters.to);
    }

    return this.http.get<RegistroCierreDiario[]>(
      `${this.kiosquerosUrl}/${buffetId}/daily-closes`,
      { params },
    );
  }

  getDailyReportCsvUrl(buffetId: string, date: string): string {
    const encodedDate = encodeURIComponent(date);

    return `${this.kiosquerosUrl}/${encodeURIComponent(buffetId)}/reports/daily.csv?date=${encodedDate}`;
  }

  downloadDailyReportCsv(buffetId: string, date: string): Observable<Blob> {
    return this.http.get(
      `${this.kiosquerosUrl}/${buffetId}/reports/daily.csv`,
      {
        params: this.buildDateParams(date),
        responseType: 'blob',
      },
    );
  }

  refreshAfterClose(buffetId: string, date: string): Observable<ReporteDiario> {
    return forkJoin({
      inventory: this.http
        .get<unknown>(`${this.inventoryUrl}/${buffetId}/overview`)
        .pipe(catchError(() => of(null))),
      orders: this.http
        .get<unknown>(`${this.kiosquerosUrl}/${buffetId}/orders`)
        .pipe(catchError(() => of(null))),
      alerts: this.http
        .get<unknown>(`${this.kiosquerosUrl}/${buffetId}/alerts`)
        .pipe(catchError(() => of(null))),
      report: this.getDailyReport(buffetId, date),
    }).pipe(map(({ report }) => report));
  }

  private buildDateParams(date?: string): HttpParams {
    const params = new HttpParams();

    return date ? params.set('date', date) : params;
  }
}
