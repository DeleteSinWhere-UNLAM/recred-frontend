import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RolUsuario } from '../../../data-access/models/perfil.model';
import { RespuestaAsistente } from '../models/respuesta-asistente.model';
import {
  MensajeAsistenteResponse,
  SesionAsistenteResponse,
} from '../models/sesion-asistente.model';

interface SchoolAssistantRequest {
  readonly sesionId?: string;
  readonly mensaje: string;
}

export interface ContextoAsistente {
  readonly rol: RolUsuario;
}

@Injectable({ providedIn: 'root' })
export class AsistenteVirtualService {
  private readonly http = inject(HttpClient);
  private readonly iaBase = `${environment.apiUrl.replace(/\/$/, '')}/ia`;

  enviarMensaje(
    contexto: ContextoAsistente,
    mensaje: string,
    sesionId: string | null,
  ): Promise<RespuestaAsistente> {
    const body: SchoolAssistantRequest = sesionId
      ? { sesionId, mensaje }
      : { mensaje };
    return firstValueFrom(
      this.http.post<RespuestaAsistente>(
        `${this.getBasePath(contexto)}/mensajes`,
        body,
      ),
    );
  }

  listarSesiones(
    contexto: ContextoAsistente,
  ): Promise<readonly SesionAsistenteResponse[]> {
    return firstValueFrom(
      this.http.get<readonly SesionAsistenteResponse[]>(
        `${this.getBasePath(contexto)}/sesiones`,
      ),
    );
  }

  obtenerMensajes(
    contexto: ContextoAsistente,
    sesionId: string,
  ): Promise<readonly MensajeAsistenteResponse[]> {
    return firstValueFrom(
      this.http.get<readonly MensajeAsistenteResponse[]>(
        `${this.getBasePath(contexto)}/sesiones/${encodeURIComponent(sesionId)}/mensajes`,
      ),
    );
  }

  cerrarSesion(contexto: ContextoAsistente, sesionId: string): Promise<void> {
    return firstValueFrom(
      this.http.patch<void>(
        `${this.getBasePath(contexto)}/sesiones/${encodeURIComponent(sesionId)}/cerrar`,
        {},
      ),
    );
  }

  eliminarSesion(contexto: ContextoAsistente, sesionId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `${this.getBasePath(contexto)}/sesiones/${encodeURIComponent(sesionId)}`,
      ),
    );
  }

  private getBasePath(contexto: ContextoAsistente): string {
    switch (contexto.rol) {
      case 'PADRE':
        return `${this.iaBase}/tutores/me/asistente`;
      case 'VENDEDOR':
        return `${this.iaBase}/kiosqueros/me/asistente`;
      case 'ALUMNO':
        return `${this.iaBase}/alumnos/me/asistente`;
      case 'ADMIN':
        return `${this.iaBase}/admin/asistente`;
    }
  }
}
