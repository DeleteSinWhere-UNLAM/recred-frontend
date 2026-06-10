import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DailyCloseResult, DailyReport } from '../models/daily-close.model';

@Injectable({ providedIn: 'root' })
export class DailyCloseService {
  private readonly http = inject(HttpClient);
  private readonly kiosquerosUrl = `${environment.apiUrl}/kiosqueros`;
  private readonly inventoryUrl = `${environment.apiUrl}/inventory`;

  closeDaily(buffetId: string, date: string): Observable<DailyCloseResult> {
    return this.http.post<DailyCloseResult>(
      `${this.kiosquerosUrl}/${buffetId}/daily-close`,
      null,
      { params: this.buildDateParams(date) },
    );
  }

  getDailyReport(buffetId: string, date: string): Observable<DailyReport> {
    return this.http.get<DailyReport>(
      `${this.kiosquerosUrl}/${buffetId}/reports/daily`,
      { params: this.buildDateParams(date) },
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

  refreshAfterClose(buffetId: string, date: string): Observable<DailyReport> {
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

  private buildDateParams(date: string): HttpParams {
    return new HttpParams().set('date', date);
  }
}
