import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  InvitacionTutor,
  ResultadoPreparacionCuentaTutor,
} from '../../directivo/models/invitacion-tutor.model';
import { InvitacionesTutorService } from '../../directivo/services/invitaciones-tutor.service';
import { InvitacionTokenStorageService } from '../services/invitacion-token-storage.service';

@Injectable()
export class AceptarInvitacionTutorPresenter {
  private readonly service = inject(InvitacionesTutorService);
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(InvitacionTokenStorageService);
  private readonly perfilService = inject(PerfilService);
  private readonly router = inject(Router);

  private readonly _loading = signal<boolean>(true);
  private readonly _invitacion = signal<InvitacionTutor | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _preparandoCuenta = signal<boolean>(false);
  private readonly _resultadoPreparacion =
    signal<ResultadoPreparacionCuentaTutor | null>(null);
  private readonly _usernameError = signal<string | null>(null);

  public get loading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  public get invitacion(): Signal<InvitacionTutor | null> {
    return this._invitacion.asReadonly();
  }

  public get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  public get preparandoCuenta(): Signal<boolean> {
    return this._preparandoCuenta.asReadonly();
  }

  public get resultadoPreparacion(): Signal<ResultadoPreparacionCuentaTutor | null> {
    return this._resultadoPreparacion.asReadonly();
  }

  public get usernameError(): Signal<string | null> {
    return this._usernameError.asReadonly();
  }

  public async validar(token: string | null): Promise<void> {
    if (!token) {
      this._loading.set(false);
      this._error.set('El link de invitacion no es valido: falta el token.');
      return;
    }

    this._token.set(token);
    this._loading.set(true);
    this._error.set(null);
    this._resultadoPreparacion.set(null);
    this._usernameError.set(null);

    try {
      const invitacion = await this.service.validarToken(token);
      this._invitacion.set(invitacion);
    } catch (err: unknown) {
      this._error.set(this.mapearError(err));
    } finally {
      this._loading.set(false);
    }
  }

  public async iniciarLogin(username?: string): Promise<void> {
    const token = this._token();
    if (!token) return;

    if (this._resultadoPreparacion() === 'ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT') {
      await this.authService.login();
      return;
    }

    if (await this.authService.isAutenticado()) {
      await this.service.aceptarInvitacion(token);
      this.tokenStorage.limpiar();
      this.perfilService.limpiar();
      await this.router.navigateByUrl('/tutor');
      return;
    }

    this._preparandoCuenta.set(true);
    this._error.set(null);
    this._usernameError.set(null);

    try {
      const usernameNormalizado = this.normalizarUsername(username);
      if (this._resultadoPreparacion() === 'USERNAME_REQUIRED' && !usernameNormalizado) {
        this._usernameError.set('Ingresa un nombre de usuario.');
        return;
      }

      const preparacion = await this.service.prepararCuenta(token, usernameNormalizado);
      this._resultadoPreparacion.set(preparacion.result);

      if (preparacion.result === 'USERNAME_REQUIRED') {
        return;
      }

      this.tokenStorage.guardar(token);

      if (preparacion.result === 'LOGIN_REQUIRED') {
        await this.authService.login();
      }
    } catch (err: unknown) {
      const mensaje = this.mapearErrorPreparacion(err);
      if (this._resultadoPreparacion() === 'USERNAME_REQUIRED') {
        this._usernameError.set(mensaje);
      } else {
        this._error.set(mensaje);
      }
    } finally {
      this._preparandoCuenta.set(false);
    }
  }

  private normalizarUsername(username?: string): string | undefined {
    const valor = username?.trim().toLowerCase();
    return valor ? valor : undefined;
  }

  private mapearErrorPreparacion(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const backendMsg =
        err.error && typeof err.error === 'object'
          ? String(
              (err.error as { message?: unknown; mensaje?: unknown }).message
                ?? (err.error as { message?: unknown; mensaje?: unknown }).mensaje
                ?? '',
            )
          : '';
      if (backendMsg) return backendMsg;
    }
    return 'No pudimos preparar tu cuenta. Intenta nuevamente en unos minutos.';
  }

  private mapearError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) return 'Esta invitacion no existe o ya fue usada.';
      if (err.status === 410) {
        return 'Esta invitacion vencio. Pedile a tu colegio que te reenvie una nueva.';
      }
      if (err.status === 409) return 'Esta invitacion ya fue aceptada.';
      const backendMsg =
        err.error && typeof err.error === 'object'
          ? String(
              (err.error as { message?: unknown; mensaje?: unknown }).message
                ?? (err.error as { message?: unknown; mensaje?: unknown }).mensaje
                ?? '',
            )
          : '';
      if (backendMsg) return backendMsg;
    }
    return 'No pudimos validar el link de invitacion. Intenta mas tarde.';
  }
}
