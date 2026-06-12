import { Injectable, signal } from '@angular/core';
import { Producto } from '../../../../features/buffet/models/producto.model';

export interface SugerenciaSaludableState {
  show: boolean;
  sugerenciaId: string;
  titulo: string;
  mensaje: string;
  producto: Producto | null;
  alumnoId: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionSugerenciaSaludableService {
  private readonly state = signal<SugerenciaSaludableState>({
    show: false,
    sugerenciaId: '',
    titulo: '',
    mensaje: '',
    producto: null,
    alumnoId: ''
  });
  readonly state$ = this.state.asReadonly();

  mostrar(sugerenciaId: string, titulo: string, mensaje: string, producto: Producto, alumnoId: string): void {
    this.state.set({ show: true, sugerenciaId, titulo, mensaje, producto, alumnoId });
  }

  cerrar(): void {
    this.state.update(s => ({ ...s, show: false }));
  }
}