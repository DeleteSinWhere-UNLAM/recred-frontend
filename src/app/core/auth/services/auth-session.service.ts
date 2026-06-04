import { Injectable } from '@angular/core';
import { fetchAuthSession, type AuthSession } from 'aws-amplify/auth';

type EsperarSesionOptions = {
  reintentos?: number;
  intervaloMs?: number;
  forceRefresh?: boolean;
};

const REINTENTOS_DEFAULT = 12;
const INTERVALO_DEFAULT_MS = 150;

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  async haySesionAutenticada(): Promise<boolean> {
    const session = await this.obtenerSesionActual();
    return this.tieneTokenParaApi(session);
  }

  async esperarSesionAutenticada(
    options: EsperarSesionOptions = {},
  ): Promise<AuthSession | null> {
    const reintentos = options.reintentos ?? REINTENTOS_DEFAULT;
    const intervaloMs = options.intervaloMs ?? INTERVALO_DEFAULT_MS;

    for (let intento = 0; intento <= reintentos; intento++) {
      const session = await this.obtenerSesionActual(options.forceRefresh);

      if (this.tieneTokenParaApi(session)) {
        return session;
      }

      if (intento < reintentos) {
        await this.demorar(intervaloMs);
      }
    }

    return null;
  }

  async obtenerIdTokenParaApi(
    options: EsperarSesionOptions = {},
  ): Promise<string | null> {
    const session = await this.esperarSesionAutenticada(options);
    return session?.tokens?.idToken?.toString() ?? null;
  }

  private async obtenerSesionActual(
    forceRefresh = false,
  ): Promise<AuthSession | null> {
    try {
      return await fetchAuthSession(forceRefresh ? { forceRefresh } : undefined);
    } catch {
      return null;
    }
  }

  private tieneTokenParaApi(session: AuthSession | null): boolean {
    return !!session?.tokens?.idToken;
  }

  private demorar(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
}
