import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SchoolRegistrationPayload } from '../models/registro-colegio.model';
import { RegistroColegioService } from '../services/registro-colegio.service';
import { ToastService } from '../../../shared/services/toast.service';

export interface RegistroError {
  campo?: string;
  mensaje: string;
}

@Injectable()
export class RegistroColegioPresenter {
  private readonly _cargando = new BehaviorSubject<boolean>(false);
  readonly cargando$ = this._cargando.asObservable();

  private readonly _enviado = new BehaviorSubject<boolean>(false);
  readonly enviado$ = this._enviado.asObservable();

  private readonly _error = new BehaviorSubject<RegistroError | null>(null);
  readonly error$ = this._error.asObservable();

  private readonly registroService = inject(RegistroColegioService);
  private readonly toastService = inject(ToastService);

  enviarSolicitud(payload: SchoolRegistrationPayload): void {
    this._cargando.next(true);
    this._error.next(null);

    this.registroService.submitRegistration(payload).subscribe({
      next: () => {
        this._cargando.next(false);
        this._enviado.next(true);
        this.toastService.mostrar('Solicitud enviada correctamente. Te contactaremos pronto.', 'success');
      },
      error: (err) => {
        console.error('Error al enviar la solicitud de registro:', err);

        const mensajeBackend = err?.error?.mensaje as string | undefined;
        let campoAfectado: string | undefined;

        if (mensajeBackend) {
          const m = mensajeBackend.toLowerCase();
          if (m.includes('email del directivo') || m.includes('email personal')) {
            campoAfectado = 'directorEmail';
          } else if (m.includes('email institucional') || m.includes('email del colegio')) {
            campoAfectado = 'schoolEmail';
          } else if (m.includes('cue')) {
            campoAfectado = 'schoolCue';
          } else if (m.includes('usuario') || m.includes('username')) {
            campoAfectado = 'directorUsername';
          } else if (m.includes('dni')) {
            campoAfectado = 'directorDni';
          }
        }

        const mensajeError = mensajeBackend ?? 'Hubo un error al enviar la solicitud. Por favor intente nuevamente.';

        this._cargando.next(false);
        this._error.next({ campo: campoAfectado, mensaje: mensajeError });
        this.toastService.mostrar('Error al enviar la solicitud.', 'error');
      },
    });
  }
}
