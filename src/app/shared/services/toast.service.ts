import { Injectable, signal } from '@angular/core';

export type ToastVariante = 'success' | 'info' | 'error';

export interface Toast {
  id: number;
  mensaje: string;
  variante: ToastVariante;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsState = signal<Toast[]>([]);
  private siguienteId = 1;

  readonly toasts = this.toastsState.asReadonly();

  mostrar(mensaje: string, variante: ToastVariante = 'success', duracionMs = 4000): void {
    const id = this.siguienteId++;
    this.toastsState.update((actuales) => [...actuales, { id, mensaje, variante }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }

  cerrar(id: number): void {
    this.toastsState.update((actuales) => actuales.filter((t) => t.id !== id));
  }
}
