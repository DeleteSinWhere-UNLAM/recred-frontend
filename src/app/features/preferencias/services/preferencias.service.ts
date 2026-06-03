import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Preferencia } from '../models/preferencia.model';

@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'https://18-119-187-167.sslip.io';

  private readonly alumnoId = '7058aa34-c843-41ca-a8dc-27c496fa7413';

  getPreferencias(): Observable<Preferencia[]> {
    return this.http
      .get<
        Preferencia[]
      >(`${this.baseUrl}/api/v1/alumnos/${this.alumnoId}/preferencias?ultima=true`)
      .pipe(map((response) => response));
  }
}
