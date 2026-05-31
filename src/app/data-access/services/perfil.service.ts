import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Perfil } from '../models/perfil.model';

export class UsuarioSinPerfilError extends Error {
  constructor() {
    super('El usuario está autenticado en Cognito pero no tiene perfil en el back');
    this.name = 'UsuarioSinPerfilError';
  }
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);

  private readonly perfilState = signal<Perfil | null>(null);
  readonly perfil: Signal<Perfil | null> = this.perfilState.asReadonly();

  async cargarPerfil(): Promise<Perfil> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/usuarios/sync`, {}),
    );
    try {
      const perfil = await firstValueFrom(
        this.http.get<Perfil>(`${environment.apiUrl}/usuarios/me`),
      );
      this.perfilState.set(perfil);
      return perfil;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        throw new UsuarioSinPerfilError();
      }
      throw err;
    }
  }

  limpiar(): void {
    this.perfilState.set(null);
  }
}
