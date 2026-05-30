import { Injectable, Signal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RecuperacionStateService {
  private readonly emailSig = signal<string | null>(null);
  private readonly codigoSig = signal<string | null>(null);

  readonly email: Signal<string | null> = this.emailSig.asReadonly();
  readonly codigo: Signal<string | null> = this.codigoSig.asReadonly();

  setEmail(valor: string): void {
    this.emailSig.set(valor);
    this.codigoSig.set(null);
  }

  setCodigo(valor: string): void {
    this.codigoSig.set(valor);
  }

  reset(): void {
    this.emailSig.set(null);
    this.codigoSig.set(null);
  }
}
