import { Injectable, Signal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly cantidadState = signal<number>(0);

  readonly cantidad: Signal<number> = this.cantidadState.asReadonly();

  setCantidad(cantidad: number): void {
    this.cantidadState.set(Math.max(0, cantidad));
  }
}
