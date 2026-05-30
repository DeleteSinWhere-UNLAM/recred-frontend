import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RecuperacionStateService } from '../../services/recuperacion-state.service';
import { ConfirmacionRecuperacion } from '../../models/confirmacion-recuperacion.model';

const LARGO_MIN_PASSWORD = 6;

@Injectable()
export class NuevaPasswordPresenter {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly stateService = inject(RecuperacionStateService);

  private readonly passwordSig = signal('');
  private readonly confirmacionSig = signal('');
  private readonly cargandoSig = signal(false);
  private readonly errorSig = signal<string | null>(null);
  private readonly completadoSig = signal(false);

  readonly password: Signal<string> = this.passwordSig.asReadonly();
  readonly confirmacion: Signal<string> = this.confirmacionSig.asReadonly();
  readonly cargando: Signal<boolean> = this.cargandoSig.asReadonly();
  readonly error: Signal<string | null> = this.errorSig.asReadonly();
  readonly completado: Signal<boolean> = this.completadoSig.asReadonly();
  readonly email = computed(() => this.stateService.email() ?? '');

  readonly formValido = computed(
    () =>
      this.passwordSig().length >= LARGO_MIN_PASSWORD &&
      this.passwordSig() === this.confirmacionSig() &&
      !this.cargandoSig() &&
      !this.completadoSig(),
  );

  constructor() {
    if (!this.stateService.email() || !this.stateService.codigo()) {
      this.router.navigateByUrl('/recuperar-password');
    }
  }

  actualizarPassword(valor: string): void {
    this.passwordSig.set(valor);
    this.errorSig.set(null);
  }

  actualizarConfirmacion(valor: string): void {
    this.confirmacionSig.set(valor);
    this.errorSig.set(null);
  }

  enviar(): void {
    if (!this.formValido() || this.cargandoSig()) return;

    const email = this.stateService.email();
    const codigo = this.stateService.codigo();
    if (!email || !codigo) return;

    const confirmacion: ConfirmacionRecuperacion = {
      email,
      codigo,
      nuevaPassword: this.passwordSig(),
    };

    this.cargandoSig.set(true);
    this.authService.confirmarNuevaPassword(confirmacion).subscribe({
      next: (resultado) => {
        this.cargandoSig.set(false);
        if (resultado.exito) {
          this.completadoSig.set(true);
        } else {
          this.errorSig.set(
            'El código es inválido o expiró. Volvé a pedir uno nuevo.',
          );
        }
      },
      error: () => {
        this.cargandoSig.set(false);
        this.errorSig.set('Ocurrió un error. Intentá de nuevo en unos segundos.');
      },
    });
  }

  irALogin(): void {
    this.stateService.reset();
    this.router.navigateByUrl('/login');
  }

  volverAlInicio(): void {
    this.stateService.reset();
    this.router.navigateByUrl('/');
  }
}
