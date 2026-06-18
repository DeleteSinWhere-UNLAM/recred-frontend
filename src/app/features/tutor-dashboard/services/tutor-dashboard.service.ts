import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TutorGlobalDashboardSummary } from '../models/tutor-dashboard.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TutorDashboardService {
  private http = inject(HttpClient);
  
  getGlobalDashboard(): Observable<TutorGlobalDashboardSummary> {
    return this.http.get<TutorGlobalDashboardSummary>(`${environment.apiUrl}/tutores/me/dashboard-global`);
  }

  transferBalance(fromStudentId: string, toStudentId: string, amount: number): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/wallets/transfer`, {
      fromStudentId,
      toStudentId,
      amount
    });
  }
}
