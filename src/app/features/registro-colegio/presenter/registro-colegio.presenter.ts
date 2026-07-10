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

        const tipoError = err?.error?.error as string | undefined;
        const mensajeBackend = err?.error?.mensaje as string | undefined;
        
        let campoAfectado: string | undefined;
        let mensajeMostrar = mensajeBackend ?? 'Hubo un error al enviar la solicitud. Por favor intente nuevamente.';

        if (tipoError === 'Error de validación' && mensajeBackend) {
          const partes = mensajeBackend.split(': ');
          if (partes.length >= 2) {
            campoAfectado = partes[0].trim();
            mensajeMostrar = partes.slice(1).join(': ').trim();
          }
          this.toastService.mostrar('Revisa los campos del formulario.', 'error');
        } else if (tipoError === 'Regla de Negocio Inválida' && mensajeBackend) {
          this.toastService.mostrar(mensajeBackend, 'error');
        } else {
          this.toastService.mostrar('Error al enviar la solicitud.', 'error');
        }

        this._cargando.next(false);
        this._error.next({ campo: campoAfectado, mensaje: mensajeMostrar });
      },
    });
  }
}
