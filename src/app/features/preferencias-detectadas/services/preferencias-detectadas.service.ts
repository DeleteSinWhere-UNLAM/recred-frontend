import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PreferenciaDetectada } from '../models/preferencia-detectada.model';

@Injectable({ providedIn: 'root' })
export class PreferenciasDetectadasService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  getPreferencias(usuarioId: string): Observable<PreferenciaDetectada[]> {
    return this.http.get<PreferenciaDetectada[]>(
      `${this.baseUrl}/usuarios/${usuarioId}/preferencias?tipo=PREFERENCIA_DETECTADA`,
    );
  }
}
