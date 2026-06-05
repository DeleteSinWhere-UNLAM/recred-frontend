import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSessionService } from '../../core/auth/services/auth-session.service';
import { Perfil, RolUsuario } from '../models/perfil.model';

const PERFIL_STORAGE_KEY = 'recred.perfil';

export class UsuarioSinPerfilError extends Error {
  constructor() {
    super(
      'El usuario está autenticado en Cognito pero no tiene perfil en el back',
    );
    this.name = 'UsuarioSinPerfilError';
  }
}

interface SyncPerfilRequest {
  readonly email?: string;
  readonly nombre?: string;
  readonly apellido?: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);

  private readonly perfilState = signal<Perfil | null>(this.leerDeStorage());
  readonly perfil: Signal<Perfil | null> = this.perfilState.asReadonly();
  readonly rol: Signal<RolUsuario | null> = computed(
    () => this.perfilState()?.rol ?? null,
  );

  async cargarPerfil(): Promise<Perfil> {
    try {
      const syncRequest = await this.armarSyncRequest();
      const perfil = await firstValueFrom(
        this.http.post<Perfil>(
          `${environment.apiUrl}/usuarios/sync`,
          syncRequest,
        ),
      );

      if (!perfil.rol || perfil.rol.toString() === 'PENDIENTE') {
        throw new UsuarioSinPerfilError();
      }

      this.perfilState.set(perfil);
      this.guardarEnStorage(perfil);
      return perfil;
    } catch (err) {
      if (err instanceof UsuarioSinPerfilError) {
        throw err;
      }
      console.error('Error al sincronizar el perfil:', err);
      throw err;
    }
  }

  async asegurarPerfil(): Promise<Perfil> {
    return this.cargarPerfil();
  }

  getPerfil(): Perfil | null {
    return this.perfilState();
  }

  obtenerBuffetId(): string | null {
    const perfil = this.perfilState();
    if (!perfil) return null;

    const candidatos = [
      perfil.buffetId,
      perfil.buffet?.id,
      perfil.buffets?.[0]?.id,
      perfil.comercioId,
      perfil.comercio?.id,
      perfil.kioscoId,
      perfil.kiosco?.id,
    ];

    return (
      candidatos.find(
        (valor): valor is string =>
          typeof valor === 'string' && valor.trim().length > 0,
      ) ?? null
    );
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
  }

  private async armarSyncRequest(): Promise<SyncPerfilRequest> {
    const attrs = await this.authSessionService.obtenerAtributosUsuario();
    return {
      email: attrs.email,
      nombre: attrs.nombre,
      apellido: attrs.apellido,
    };
  }
}
