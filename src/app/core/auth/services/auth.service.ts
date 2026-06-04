import { Injectable, inject } from '@angular/core';
import {
  fetchUserAttributes,
  signInWithRedirect,
  signOut,
} from 'aws-amplify/auth';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly perfilService = inject(PerfilService);
  private readonly authSessionService = inject(AuthSessionService);

  async login(): Promise<void> {
    if (await this.isAutenticado()) {
      return;
    }
    this.interceptarRedirectParaForzarIdioma('es');
    await signInWithRedirect();
  }

  async logout(): Promise<void> {
    this.perfilService.limpiar();
    await signOut();
  }

  async isAutenticado(): Promise<boolean> {
    return this.authSessionService.haySesionAutenticada();
  }

  async esperarAutenticacion(): Promise<boolean> {
    const session = await this.authSessionService.esperarSesionAutenticada();
    return !!session;
  }

  async getSub(): Promise<string | undefined> {
    try {
      const attrs = await fetchUserAttributes();
      return attrs.sub;
    } catch {
      return undefined;
    }
  }

  private interceptarRedirectParaForzarIdioma(lang: string): void {
    const dominioCognito = environment.cognito.oauth.domain;
    const proto = Object.getPrototypeOf(window.location) as Location;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'href');
    if (!descriptor?.set || !descriptor?.get) return;
    const originalSet = descriptor.set;
    const originalGet = descriptor.get;

    Object.defineProperty(window.location, 'href', {
      configurable: true,
      get: originalGet.bind(window.location),
      set(url: string) {
        const debeAppendear = url.includes(dominioCognito);
        const finalUrl = debeAppendear
          ? `${url}${url.includes('?') ? '&' : '?'}lang=${lang}`
          : url;
        originalSet.call(window.location, finalUrl);
      },
    });
  }
}
