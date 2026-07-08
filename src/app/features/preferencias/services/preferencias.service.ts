import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Preferencia } from '../models/preferencia.model';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../../../data-access/services/perfil.service';

@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);

  private readonly fallbackAlumnoId = '7058aa34-c843-41ca-a8dc-27c496fa7413';

  private getPath(alumnoId: string): string {
    const perfil = this.perfilService.getPerfil();
    if (perfil && perfil.rol === 'ALUMNO' && perfil.id === alumnoId) {
      return `usuarios/${alumnoId}`;
    }
    return `alumnos/${alumnoId}`;
  }

  getPreferencias(alumnoIdSeleccionado?: string): Observable<Preferencia[]> {
    const alumnoId = alumnoIdSeleccionado ?? this.perfilService.obtenerAlumnoId() ?? this.fallbackAlumnoId;
    const path = this.getPath(alumnoId);
    return this.http
      .get<Preferencia[]>(`${environment.apiUrl}/${path}/preferencias`)
      .pipe(map((response) => response));
  }
}
