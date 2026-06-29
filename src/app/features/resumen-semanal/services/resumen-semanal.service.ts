import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ResumenSemanal } from '../models/resumen-semanal.model';

@Injectable({ providedIn: 'root' })
export class ResumenSemanalService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  getResumen(): Observable<ResumenSemanal> {
    return this.http.get<ResumenSemanal>(
      `${this.baseUrl}/resumen/me`,
    );
  }
}
