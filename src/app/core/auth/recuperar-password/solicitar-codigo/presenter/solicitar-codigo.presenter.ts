import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RecuperacionStateService } from '../../services/recuperacion-state.service';
import { SolicitudRecuperacion } from '../../models/solicitud-recuperacion.model';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class SolicitarCodigoPresenter {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly stateService = inject(RecuperacionStateService);

  private readonly emailSig = signal(this.stateService.email() ?? '');
  private readonly cargandoSig = signal(false);
  private readonly errorSig = signal<string | null>(null);

  readonly email: Signal<string> = this.emailSig.asReadonly();
  readonly cargando: Signal<boolean> = this.cargandoSig.asReadonly();
  readonly error: Signal<string | null> = this.errorSig.asReadonly();

  readonly formValido = computed(
    () => REGEX_EMAIL.test(this.emailSig()) && !this.cargandoSig(),
  );

  actualizarEmail(valor: string): void {
    this.emailSig.set(valor);
    this.errorSig.set(null);
  }

  enviar(): void {
    if (!this.formValido() || this.cargandoSig()) return;

    const solicitud: SolicitudRecuperacion = {
      email: this.emailSig().trim(),
    };

    this.cargandoSig.set(true);
    this.authService.enviarCodigoRecuperacion(solicitud).subscribe({
      next: (resultado) => {
        this.cargandoSig.set(false);
        if (resultado.exito) {
          this.stateService.setEmail(solicitud.email);
          this.router.navigateByUrl('/recuperar-password/codigo');
        } else {
          this.errorSig.set(
            'No pudimos enviar el código. Verificá el email e intentá de nuevo.',
          );
        }
      },
      error: () => {
        this.cargandoSig.set(false);
        this.errorSig.set('Ocurrió un error. Intentá de nuevo en unos segundos.');
      },
    });
  }

  volverAlLogin(): void {
    this.stateService.reset();
    this.router.navigateByUrl('/login');
  }

  volverAlInicio(): void {
    this.stateService.reset();
    this.router.navigateByUrl('/');
  }
}
