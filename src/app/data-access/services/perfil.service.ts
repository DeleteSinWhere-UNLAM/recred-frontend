import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Perfil, RolUsuario } from '../models/perfil.model';

const PERFIL_STORAGE_KEY = 'recred.perfil';

export class UsuarioSinPerfilError extends Error {
  constructor() {
    super('El usuario está autenticado en Cognito pero no tiene perfil en el back');
    this.name = 'UsuarioSinPerfilError';
  }
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);

  private readonly perfilState = signal<Perfil | null>(this.leerDeStorage());
  readonly perfil: Signal<Perfil | null> = this.perfilState.asReadonly();
  readonly rol: Signal<RolUsuario | null> = computed(() => this.perfilState()?.rol ?? null);

  async cargarPerfil(): Promise<Perfil> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/usuarios/sync`, {}),
    );
    try {
      const perfil = await firstValueFrom(
        this.http.get<Perfil>(`${environment.apiUrl}/usuarios/me`),
      );
      this.perfilState.set(perfil);
      this.guardarEnStorage(perfil);
      return perfil;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        throw new UsuarioSinPerfilError();
      }
      throw err;
    }
  }

  getPerfil(): Perfil | null {
    return this.perfilState();
  }

  limpiar(): void {
    this.perfilState.set(null);
    localStorage.removeItem(PERFIL_STORAGE_KEY);
  }

  private leerDeStorage(): Perfil | null {
    const raw = localStorage.getItem(PERFIL_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Perfil;
    } catch {
      localStorage.removeItem(PERFIL_STORAGE_KEY);
      return null;
    }
  }

  private guardarEnStorage(perfil: Perfil): void {
    localStorage.setItem(PERFIL_STORAGE_KEY, JSON.stringify(perfil));
    console.log('Perfil guardado en storage:', perfil);
  }
}
