import { Injectable, signal } from '@angular/core';

export interface SaldoBajoState {
  show: boolean;
  balance: number;
  alumnoId: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionSaldoBajoService {
  private readonly state = signal<SaldoBajoState>({ show: false, balance: 0, alumnoId: '' });
  readonly state$ = this.state.asReadonly();

  mostrar(balance: number, alumnoId: string): void {
    this.state.set({ show: true, balance, alumnoId });
  }

  cerrar(): void {
    this.state.update(s => ({ ...s, show: false }));
  }
}
