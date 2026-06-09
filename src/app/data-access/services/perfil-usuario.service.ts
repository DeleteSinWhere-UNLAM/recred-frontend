import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarPerfilUsuarioRequest,
  PerfilUsuario,
  UsuarioLogueado,
} from '../models/perfil-usuario.model';
import { PerfilService } from './perfil.service';

@Injectable({ providedIn: 'root' })
export class PerfilUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);

  obtenerUsuarioLogueado(): Promise<UsuarioLogueado> {
    return firstValueFrom(
      this.http.get<UsuarioLogueado>(`${environment.apiUrl}/users/me`),
    );
  }

  obtenerPerfil(): Promise<PerfilUsuario> {
    return firstValueFrom(
      this.http.get<PerfilUsuario>(`${environment.apiUrl}/users/me/profile`),
    );
  }

  async actualizarPerfil(
    cambios: ActualizarPerfilUsuarioRequest,
  ): Promise<PerfilUsuario> {
    const perfil = await firstValueFrom(
      this.http.patch<PerfilUsuario>(
        `${environment.apiUrl}/users/me/profile`,
        cambios,
      ),
    );
    this.perfilService.actualizarDatosUsuario(perfil);
    return perfil;
  }
}
