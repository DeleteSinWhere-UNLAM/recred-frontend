import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SchoolRegistration } from '../models/solicitud-colegio.model';

@Injectable({ providedIn: 'root' })
export class RecredAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/school-registrations`;

  getPendingRegistrations(): Observable<SchoolRegistration[]> {
    return this.http.get<SchoolRegistration[]>(`${this.apiUrl}?status=PENDING`);
  }

  approveRegistration(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectRegistration(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, {});
  }
}
