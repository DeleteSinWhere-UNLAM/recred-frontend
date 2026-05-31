import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CredencialesLogin } from '../models/credenciales-login.model';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LARGO_MIN_PASSWORD = 6;

@Injectable()
export class LoginPresenter {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly emailSig = signal('');
  private readonly passwordSig = signal('');
  private readonly cargandoSig = signal(false);
  private readonly errorSig = signal<string | null>(null);

  readonly email: Signal<string> = this.emailSig.asReadonly();
  readonly password: Signal<string> = this.passwordSig.asReadonly();
  readonly cargando: Signal<boolean> = this.cargandoSig.asReadonly();
  readonly error: Signal<string | null> = this.errorSig.asReadonly();

  readonly formValido = computed(
    () =>
      REGEX_EMAIL.test(this.emailSig()) &&
      this.passwordSig().length >= LARGO_MIN_PASSWORD,
  );

  actualizarEmail(valor: string): void {
    this.emailSig.set(valor);
    this.errorSig.set(null);
  }

  actualizarPassword(valor: string): void {
    this.passwordSig.set(valor);
    this.errorSig.set(null);
  }

  enviar(): void {
    if (!this.formValido() || this.cargandoSig()) return;

    const credenciales: CredencialesLogin = {
      email: this.emailSig().trim(),
      password: this.passwordSig(),
    };

    this.cargandoSig.set(true);
    this.authService.login(credenciales).subscribe({
      next: (resultado) => {
        this.cargandoSig.set(false);
        if (resultado.exito) {
          this.router.navigateByUrl('/padre');
        } else {
          this.errorSig.set('Email o contraseña incorrectos');
        }
      },
      error: () => {
        this.cargandoSig.set(false);
        this.errorSig.set('No pudimos iniciar sesión. Intentá de nuevo.');
      },
    });
  }

  volverAlInicio(): void {
    this.router.navigateByUrl('/');
  }

  irARegistro(): void {
    this.router.navigateByUrl('/registro');
  }

  irARecuperar(): void {
    this.router.navigateByUrl('/recuperar-password');
  }
}
