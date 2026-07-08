import { Injectable } from '@angular/core';
import { fetchAuthSession, type AuthSession } from 'aws-amplify/auth';

export interface AtributosUsuarioCognito {
  readonly sub?: string;
  readonly email?: string;
  readonly nombre?: string;
  readonly apellido?: string;
}

interface EsperarSesionOptions {
  reintentos?: number;
  intervaloMs?: number;
  forceRefresh?: boolean;
}

const REINTENTOS_DEFAULT = 12;
const INTERVALO_DEFAULT_MS = 250;

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  async haySesionAutenticada(): Promise<boolean> {
    const session = await this.obtenerSesionActual();
    return this.tieneTokenParaApi(session);
  }

  async esperarSesionAutenticada(
    options: EsperarSesionOptions = {},
  ): Promise<AuthSession | null> {
    if (!this.tieneDatosDeSesionEnStorage()) {
      return null;
    }

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

  private tieneDatosDeSesionEnStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('CognitoIdentityServiceProvider') || key.startsWith('amplify-'))) {
        return true;
      }
    }
    return false;
  }

  async obtenerAccessTokenParaApi(
    options: EsperarSesionOptions = {},
  ): Promise<string | null> {
    const session = await this.esperarSesionAutenticada(options);
    return session?.tokens?.accessToken.toString() ?? null;
  }

  async obtenerIdToken(
    options: EsperarSesionOptions = {},
  ): Promise<string | null> {
    const session = await this.esperarSesionAutenticada(options);
    return session?.tokens?.idToken?.toString() ?? null;
  }

  async obtenerSub(): Promise<string | undefined> {
    const session = await this.obtenerSesionActual();
    return (
      session?.userSub ??
      this.valorString(session?.tokens?.idToken?.payload.sub)
    );
  }

  async obtenerAtributosUsuario(): Promise<AtributosUsuarioCognito> {
    const session = await this.esperarSesionAutenticada();
    const payload = session?.tokens?.idToken?.payload;

    if (!payload) {
      return {};
    }

    return {
      sub: this.valorString(payload.sub),
      email: this.valorString(payload['email']),
      nombre:
        this.valorString(payload['given_name']) ??
        this.valorString(payload['name']),
      apellido: this.valorString(payload['family_name']),
    };
  }

  private async obtenerSesionActual(
    forceRefresh = false,
  ): Promise<AuthSession | null> {
    try {
      return await fetchAuthSession(
        forceRefresh ? { forceRefresh } : undefined,
      );
    } catch (err) {
      console.error('Error obteniendo sesión de Cognito', err);
      return null;
    }
  }

  private tieneTokenParaApi(session: AuthSession | null): boolean {
    const accessToken = session?.tokens?.accessToken;
    const idToken = session?.tokens?.idToken;

    if (!accessToken || !idToken) {
      console.warn('Sesión incompleta', {
        tieneAccessToken: !!accessToken,
        tieneIdToken: !!idToken,
        userSub: session?.userSub,
      });
      return false;
    }
    return true;
  }

  private demorar(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  private valorString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : undefined;
  }
}
