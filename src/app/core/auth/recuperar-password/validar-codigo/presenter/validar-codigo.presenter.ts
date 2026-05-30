import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RecuperacionStateService } from '../../services/recuperacion-state.service';

const REGEX_CODIGO_OTP = /^\d{6}$/;

@Injectable()
export class ValidarCodigoPresenter {
  private readonly router = inject(Router);
  private readonly stateService = inject(RecuperacionStateService);

  private readonly codigoSig = signal('');
  private readonly errorSig = signal<string | null>(null);

  readonly codigo: Signal<string> = this.codigoSig.asReadonly();
  readonly error: Signal<string | null> = this.errorSig.asReadonly();
  readonly email = computed(() => this.stateService.email() ?? '');

  readonly formValido = computed(() =>
    REGEX_CODIGO_OTP.test(this.codigoSig()),
  );

  constructor() {
    if (!this.stateService.email()) {
      this.router.navigateByUrl('/recuperar-password');
    }
  }

  actualizarCodigo(valor: string): void {
    this.codigoSig.set(valor);
    this.errorSig.set(null);
  }

  enviar(): void {
    if (!this.formValido()) return;
    this.stateService.setCodigo(this.codigoSig());
    this.router.navigateByUrl('/recuperar-password/nueva');
  }

  reenviarCodigo(): void {
    this.router.navigateByUrl('/recuperar-password');
  }

  volverAlInicio(): void {
    this.stateService.reset();
    this.router.navigateByUrl('/');
  }
}
