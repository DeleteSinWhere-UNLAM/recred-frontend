import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DatosRegistro } from '../models/datos-registro.model';
import { TipoUsuario } from '../models/tipo-usuario.model';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^\+?\d{8,15}$/;
const REGEX_NOMBRE_COMPLETO = /^\S+\s+\S+/;
const LARGO_MIN_PASSWORD = 6;
const LARGO_MIN_DIRECCION = 5;

@Injectable()
export class RegistroPresenter {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly nombreCompletoSig = signal('');
  private readonly emailSig = signal('');
  private readonly passwordSig = signal('');
  private readonly telefonoSig = signal('');
  private readonly direccionSig = signal('');
  private readonly tipoUsuarioSig = signal<TipoUsuario | null>(null);
  private readonly cargandoSig = signal(false);
  private readonly errorSig = signal<string | null>(null);

  readonly nombreCompleto: Signal<string> = this.nombreCompletoSig.asReadonly();
  readonly email: Signal<string> = this.emailSig.asReadonly();
  readonly password: Signal<string> = this.passwordSig.asReadonly();
  readonly telefono: Signal<string> = this.telefonoSig.asReadonly();
  readonly direccion: Signal<string> = this.direccionSig.asReadonly();
  readonly tipoUsuario: Signal<TipoUsuario | null> =
    this.tipoUsuarioSig.asReadonly();
  readonly cargando: Signal<boolean> = this.cargandoSig.asReadonly();
  readonly error: Signal<string | null> = this.errorSig.asReadonly();

  readonly formValido = computed(
    () =>
      REGEX_NOMBRE_COMPLETO.test(this.nombreCompletoSig().trim()) &&
      REGEX_EMAIL.test(this.emailSig()) &&
      this.passwordSig().length >= LARGO_MIN_PASSWORD &&
      REGEX_TELEFONO.test(this.telefonoSig()) &&
      this.direccionSig().trim().length >= LARGO_MIN_DIRECCION &&
      this.tipoUsuarioSig() !== null,
  );

  actualizarNombreCompleto(valor: string): void {
    this.nombreCompletoSig.set(valor);
    this.errorSig.set(null);
  }

  actualizarEmail(valor: string): void {
    this.emailSig.set(valor);
    this.errorSig.set(null);
  }

  actualizarPassword(valor: string): void {
    this.passwordSig.set(valor);
    this.errorSig.set(null);
  }

  actualizarTelefono(valor: string): void {
    this.telefonoSig.set(valor);
    this.errorSig.set(null);
  }

  actualizarDireccion(valor: string): void {
    this.direccionSig.set(valor);
    this.errorSig.set(null);
  }

  seleccionarTipoUsuario(tipo: TipoUsuario): void {
    this.tipoUsuarioSig.set(tipo);
    this.errorSig.set(null);
  }

  enviar(): void {
    if (!this.formValido() || this.cargandoSig()) return;

    const tipo = this.tipoUsuarioSig()!;
    const datos: DatosRegistro = {
      nombreCompleto: this.nombreCompletoSig().trim(),
      email: this.emailSig().trim(),
      password: this.passwordSig(),
      telefono: this.telefonoSig(),
      direccion: this.direccionSig().trim(),
      tipoUsuario: tipo,
    };

    this.cargandoSig.set(true);
    this.authService.registrar(datos).subscribe({
      next: (resultado) => {
        this.cargandoSig.set(false);
        if (resultado.exito) {
          this.router.navigateByUrl(tipo === 'tutor' ? '/padre' : '/kiosquero');
        } else {
          this.errorSig.set(
            'No pudimos crear tu cuenta. Verificá los datos e intentá de nuevo.',
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
    this.router.navigateByUrl('/login');
  }

  volverAlInicio(): void {
    this.router.navigateByUrl('/');
  }
}
