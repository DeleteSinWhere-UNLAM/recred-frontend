import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  InvitacionTutor,
  InvitacionTutorPayload,
} from '../../models/invitacion-tutor.model';
import { InvitacionesTutorService } from '../../services/invitaciones-tutor.service';

@Injectable()
export class InvitarTutorPresenter {
  private readonly service = inject(InvitacionesTutorService);
  private readonly router = inject(Router);

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _resultado = signal<InvitacionTutor | null>(null);

  public get loading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  public get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  public get resultado(): Signal<InvitacionTutor | null> {
    return this._resultado.asReadonly();
  }

  public async invitar(payload: InvitacionTutorPayload): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._resultado.set(null);

    try {
      const invitacion = await this.service.invitarTutor(payload);
      this._resultado.set(invitacion);
    } catch (err: unknown) {
      this._error.set(this.mapearError(err));
    } finally {
      this._loading.set(false);
    }
  }

  public volver(): void {
    this.router.navigate(['/directivo']);
  }

  public limpiarResultado(): void {
    this._resultado.set(null);
    this._error.set(null);
  }

  private mapearError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const backendMsg =
        err.error && typeof err.error === 'object' && 'message' in err.error
          ? String((err.error as { message?: unknown }).message ?? '')
          : '';
      if (backendMsg) return backendMsg;
      if (err.status === 400) return 'Datos inválidos. Revisá el email.';
      if (err.status === 403) return 'No tenés permisos para invitar tutores.';
      if (err.status >= 500) return 'Error del servidor. Intentá más tarde.';
    }
    return 'No se pudo enviar la invitación. Intentá nuevamente.';
  }
}
