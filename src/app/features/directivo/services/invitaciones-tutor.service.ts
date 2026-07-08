import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ColegioAsociadoTutor,
  InvitacionTutor,
  InvitacionTutorPayload,
  ReporteImportacionCsv,
} from '../models/invitacion-tutor.model';

@Injectable({ providedIn: 'root' })
export class InvitacionesTutorService {
  private readonly http = inject(HttpClient);

  invitarTutor(payload: InvitacionTutorPayload): Promise<InvitacionTutor> {
    return firstValueFrom(
      this.http.post<InvitacionTutor>(
        `${environment.apiUrl}/colegio/tutores/invitaciones`,
        payload,
      ),
    );
  }

  importarCsv(archivo: File): Promise<ReporteImportacionCsv> {
    const formData = new FormData();
    formData.append('file', archivo);
    return firstValueFrom(
      this.http.post<ReporteImportacionCsv>(
        `${environment.apiUrl}/colegio/tutores/invitaciones/import`,
        formData,
      ),
    );
  }

  validarToken(token: string): Promise<InvitacionTutor> {
    return firstValueFrom(
      this.http.get<InvitacionTutor>(
        `${environment.apiUrl}/invitaciones/tutor/${encodeURIComponent(token)}`,
      ),
    );
  }

  aceptarInvitacion(token: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(
        `${environment.apiUrl}/invitaciones/tutor/${encodeURIComponent(token)}/aceptar`,
        null,
      ),
    );
  }

  obtenerColegiosDelTutor(): Promise<ColegioAsociadoTutor[]> {
    return firstValueFrom(
      this.http.get<ColegioAsociadoTutor[]>(
        `${environment.apiUrl}/tutores/me/colegios`,
      ),
    );
  }
}
