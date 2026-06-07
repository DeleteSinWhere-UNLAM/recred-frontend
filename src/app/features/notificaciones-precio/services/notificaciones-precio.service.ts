import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { NotificacionPrecio } from '../models/notificacion-precio.model';

@Injectable({ providedIn: 'root' })
export class NotificacionesPrecioService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  getNotificaciones(usuarioId: string): Observable<NotificacionPrecio[]> {
    return this.http.get<NotificacionPrecio[]>(
      `${this.baseUrl}/usuarios/${usuarioId}/preferencias?tipo=ALERTA_PRECIO&ultima=true`,
    );
  }
}
