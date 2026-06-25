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

  async obtenerPerfil(): Promise<PerfilUsuario> {
    const perfil = await firstValueFrom(
      this.http.get<PerfilUsuario>(`${environment.apiUrl}/users/me/profile`),
    );
    this.perfilService.actualizarDatosUsuario(perfil);
    return perfil;
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

  async subirFotoPerfil(archivo: File): Promise<PerfilUsuario> {
    const formData = new FormData();
    formData.append('foto', archivo);
    const perfil = await firstValueFrom(
      this.http.post<PerfilUsuario>(
        `${environment.apiUrl}/users/me/profile/foto`,
        formData,
      ),
    );
    this.perfilService.actualizarDatosUsuario(perfil);
    return perfil;
  }
}
