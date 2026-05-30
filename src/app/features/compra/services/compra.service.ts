import { Injectable, signal } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import {
  OrdenAlumno,
  OrdenCompra,
} from '../models/orden-compra.model';

const ANIMALES_CODIGO = [
  'Lobo', 'Tigre', 'Puma', 'Oso', 'Gato', 'Perro', 'Zorro', 'Rana',
  'Sapo', 'Búho', 'Pato', 'Cisne', 'Loro', 'Pez', 'Foca', 'Cebra',
  'Morsa', 'Koala', 'Panda', 'Gallo', 'Pollo', 'Ganso', 'Toro', 'Vaca',
];

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly ordenEnCursoState = signal<OrdenCompra | null>(null);
  private readonly ultimaOrdenState = signal<OrdenCompra | null>(null);

  readonly ordenEnCurso = this.ordenEnCursoState.asReadonly();
  readonly ultimaOrden = this.ultimaOrdenState.asReadonly();

  iniciarOrden(ordenes: OrdenAlumno[]): void {
    const total = ordenes.reduce((acc, o) => acc + o.subtotal, 0);
    this.ordenEnCursoState.set({
      id: '',
      ordenes,
      total,
      codigos: {},
    });
  }

  cancelarOrden(): void {
    this.ordenEnCursoState.set(null);
  }

  simularPago(): Observable<OrdenCompra> {
    const enCurso = this.ordenEnCursoState();
    if (!enCurso) {
      return of({ id: '', ordenes: [], total: 0, codigos: {} });
    }
    return of(enCurso).pipe(
      delay(700),
      map((orden) => {
        const codigos: Record<string, string> = {};
        for (const o of orden.ordenes) {
          codigos[o.alumno.id] = this.generarCodigoRetiro();
        }
        const pagada: OrdenCompra = {
          ...orden,
          id: crypto.randomUUID(),
          codigos,
        };
        this.ultimaOrdenState.set(pagada);
        this.ordenEnCursoState.set(null);
        return pagada;
      }),
    );
  }

  generarCodigoRetiro(): string {
    const idx = Math.floor(Math.random() * ANIMALES_CODIGO.length);
    return ANIMALES_CODIGO[idx];
  }
}
