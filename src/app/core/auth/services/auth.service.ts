import { Injectable, inject } from '@angular/core';
import { signInWithRedirect, signOut } from 'aws-amplify/auth';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly perfilService = inject(PerfilService);
  private readonly authSessionService = inject(AuthSessionService);
  amplify = { signInWithRedirect, signOut };

  async login(): Promise<void> {
    if (await this.isAutenticado()) {
      return;
    }

    this.perfilService.limpiar();
    await this.amplify.signInWithRedirect({
      options: {
        lang: 'es',
      },
    });
  }

  async logout(): Promise<void> {
    this.perfilService.limpiar();

    try {
      await this.amplify.signOut();
    } catch (err) {
      console.error('Error durante el signOut', err);
    }
  }

  async isAutenticado(): Promise<boolean> {
    return this.authSessionService.haySesionAutenticada();
  }

  async esperarAutenticacion(): Promise<boolean> {
    const session = await this.authSessionService.esperarSesionAutenticada({
      reintentos: 20,
      intervaloMs: 250,
    });
    return !!session;
  }

  async getSub(): Promise<string | undefined> {
    return this.authSessionService.obtenerSub();
  }
}
