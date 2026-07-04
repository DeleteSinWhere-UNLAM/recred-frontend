import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SchoolRegistrationPayload } from '../models/registro-colegio.model';

@Injectable({ providedIn: 'root' })
export class RegistroColegioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/school-registrations`;

  submitRegistration(payload: SchoolRegistrationPayload): Observable<void> {
    return this.http.post<void>(this.apiUrl, payload);
  }
}
