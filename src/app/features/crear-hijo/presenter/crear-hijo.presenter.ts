import { Injectable, Signal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AlumnosService,
  CrearHijoRequest,
} from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';

@Injectable()
export class CrearHijoPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private readonly guardandoState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly guardando: Signal<boolean> = this.guardandoState.asReadonly();
  readonly error: Signal<string | null> = this.errorState.asReadonly();

  async crear(req: CrearHijoRequest): Promise<boolean> {
    if (this.guardandoState()) return false;

    this.guardandoState.set(true);
    this.errorState.set(null);
    try {
      const alumno = await this.alumnosService.crearHijo(req);
      this.toastService.mostrar(
        `${alumno.nombre} ${alumno.apellido} fue agregado como hijo`,
        'success',
      );
      await this.router.navigateByUrl('/tutor');
      return true;
    } catch (err) {
      const mensaje = this.mensajeDeError(err);
      this.errorState.set(mensaje);
      this.toastService.mostrar(mensaje, 'error');
      return false;
    } finally {
      this.guardandoState.set(false);
    }
  }

  private mensajeDeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const backendMsg =
        (err.error && typeof err.error === 'object' && 'message' in err.error
          ? String((err.error as { message?: unknown }).message ?? '')
          : '') ||
        (typeof err.error === 'string' ? err.error : '');

      if (backendMsg) return backendMsg;

      if (err.status === 400) return 'Datos invalidos. Revisa los campos.';
      if (err.status === 403) return 'No tenes permiso para crear un hijo.';
      if (err.status === 409) return 'Ya existe un alumno con esos datos.';
      if (err.status >= 500) return 'Error del servidor. Intenta mas tarde.';
    }
    return 'No se pudo crear el hijo. Intenta nuevamente.';
  }
}
