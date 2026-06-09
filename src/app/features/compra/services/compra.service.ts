import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OrdenAlumno,
  OrdenCompra,
} from '../models/orden-compra.model';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly http = inject(HttpClient);
  
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
    if (!enCurso || enCurso.ordenes.length === 0) {
      return of({ id: '', ordenes: [], total: 0, codigos: {} });
    }

    const requests = enCurso.ordenes.map(orden => {
      const payload = {
        orders: [
          {
            studentId: orden.alumno.id,
            date: new Date(orden.fecha).toISOString(),
            recessTime: orden.recreo,
            items: orden.items.map(item => ({
              productId: item.producto.id,
              quantity: item.cantidad
            }))
          }
        ]
      };
      
      return this.http.post<{ codes: Record<string, string> }>(`${environment.apiUrl}/purchases/advance`, payload).pipe(
        map(response => ({
          studentId: orden.alumno.id,
          codigo: response.codes[orden.alumno.id]
        }))
      );
    });

    return forkJoin(requests).pipe(
      map(results => {
        const codigos: Record<string, string> = {};
        for (const res of results) {
          codigos[res.studentId] = res.codigo;
        }

        const pagada: OrdenCompra = {
          ...enCurso,
          id: crypto.randomUUID(),
          codigos,
        };
        this.ultimaOrdenState.set(pagada);
        this.ordenEnCursoState.set(null);
        return pagada;
      })
    );
  }
}
