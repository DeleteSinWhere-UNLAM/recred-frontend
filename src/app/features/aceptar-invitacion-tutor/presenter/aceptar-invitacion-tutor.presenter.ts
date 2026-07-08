import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { InvitacionTutor } from '../../directivo/models/invitacion-tutor.model';
import { InvitacionesTutorService } from '../../directivo/services/invitaciones-tutor.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { InvitacionTokenStorageService } from '../services/invitacion-token-storage.service';

@Injectable()
export class AceptarInvitacionTutorPresenter {
  private readonly service = inject(InvitacionesTutorService);
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(InvitacionTokenStorageService);

  private readonly _loading = signal<boolean>(true);
  private readonly _invitacion = signal<InvitacionTutor | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _token = signal<string | null>(null);

  public get loading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  public get invitacion(): Signal<InvitacionTutor | null> {
    return this._invitacion.asReadonly();
  }

  public get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  public async validar(token: string | null): Promise<void> {
    if (!token) {
      this._loading.set(false);
      this._error.set('El link de invitación no es válido: falta el token.');
      return;
    }

    this._token.set(token);
    this._loading.set(true);
    this._error.set(null);

    try {
      const invitacion = await this.service.validarToken(token);
      this._invitacion.set(invitacion);
    } catch (err: unknown) {
      this._error.set(this.mapearError(err));
    } finally {
      this._loading.set(false);
    }
  }

  public async iniciarLogin(): Promise<void> {
    const token = this._token();
    if (!token) return;
    this.tokenStorage.guardar(token);
    await this.authService.login();
  }

  private mapearError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) return 'Esta invitación no existe o ya fue usada.';
      if (err.status === 410) return 'Esta invitación venció. Pedile a tu colegio que te reenvíe una nueva.';
      if (err.status === 409) return 'Esta invitación ya fue aceptada.';
      const backendMsg =
        err.error && typeof err.error === 'object' && 'message' in err.error
          ? String((err.error as { message?: unknown }).message ?? '')
          : '';
      if (backendMsg) return backendMsg;
    }
    return 'No pudimos validar el link de invitación. Intentá más tarde.';
  }
}
