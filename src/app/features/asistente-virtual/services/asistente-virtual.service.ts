import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RespuestaAsistente } from '../models/respuesta-asistente.model';

interface SchoolAssistantRequest {
  readonly sesionId: string | null;
  readonly mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AsistenteVirtualService {
  private readonly http = inject(HttpClient);
  private readonly iaBase = environment.apiUrl.replace(/\/api\/v\d+\/?$/, '') + '/ia';

  enviarMensaje(
    alumnoId: string,
    mensaje: string,
    sesionId: string | null,
  ): Promise<RespuestaAsistente> {
    const body: SchoolAssistantRequest = { sesionId, mensaje };
    return firstValueFrom(
      this.http.post<RespuestaAsistente>(
        `${this.iaBase}/alumnos/${alumnoId}/asistente/mensajes`,
        body,
      ),
    );
  }
}
