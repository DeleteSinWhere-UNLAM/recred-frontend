import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  OrdenAlumno,
  OrdenCompra,
} from '../models/orden-compra.model';

interface AdvancePurchaseResponse {
  orderId?: string;
  codes?: Record<string, string>;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);

  private readonly ordenEnCursoState = signal<OrdenCompra | null>(null);
  private readonly ultimaOrdenState = signal<OrdenCompra | null>(null);
  private readonly sugerenciaPendienteState = signal<string | null>(null);

  readonly ordenEnCurso = this.ordenEnCursoState.asReadonly();
  readonly ultimaOrden = this.ultimaOrdenState.asReadonly();

  setSugerenciaPendiente(id: string): void {
    this.sugerenciaPendienteState.set(id);
  }

  iniciarOrden(ordenes: OrdenAlumno[], sugerenciaId?: string): void {
    const total = ordenes.reduce((acc, o) => acc + o.subtotal, 0);

    const finalSugerenciaId = sugerenciaId || this.sugerenciaPendienteState();

    this.ordenEnCursoState.set({
      id: '',
      ordenes,
      total,
      codigos: {},
      sugerenciaId: finalSugerenciaId ?? undefined,
    });

    this.sugerenciaPendienteState.set(null);
  }

  cancelarOrden(): void {
    this.ordenEnCursoState.set(null);
  }

  procesarPago(): Observable<OrdenCompra> {
    const enCurso = this.ordenEnCursoState();
    if (!enCurso || enCurso.ordenes.length === 0) {
      return of({ id: '', ordenes: [], total: 0, codigos: {} });
    }

    const perfil = this.perfilService.getPerfil();
    if (!perfil) {
      throw new Error('Usuario no autenticado o sin perfil.');
    }

    const buyerId = perfil.id;
    const buyerType = perfil.rol === 'PADRE' ? 'TUTOR' : 'STUDENT';

    const ordersPayload = enCurso.ordenes.map(o => {
      const recessTimeMapping: Record<string, string> = {
        PRIMER_RECREO: 'FIRST_RECESS',
        SEGUNDO_RECREO: 'SECOND_RECESS',
        MEDIODIA: 'NOON',
        FUERA_HORA: 'AFTER_HOURS'
      };

      return {
        studentId: o.alumno.id,
        buyerId: buyerId,
        buyerType: buyerType,
        date: o.fecha,
        recessTime: recessTimeMapping[o.recreo] || 'FIRST_RECESS',
        items: o.items.map(item => ({
          productId: item.producto.id,
          quantity: item.cantidad
        }))
      };
    });

    const requestPayload = {
      orders: ordersPayload
    };

    return this.http.post<AdvancePurchaseResponse>(`${environment.apiUrl}/purchases/advance`, requestPayload).pipe(
      map((response) => {
        const pagada: OrdenCompra = {
          ...enCurso,
          id: response.orderId || crypto.randomUUID(),
          codigos: response.codes || {},
          total: response.total || enCurso.total
        };
        this.ultimaOrdenState.set(pagada);
        this.ordenEnCursoState.set(null);
        return pagada;
      })
    );
  }

  deliver(purchaseId: string, code: string) {
    const url = `${environment.apiUrl}/purchases/${purchaseId}/deliver`;
    return this.http.post<void>(url, { withdrawalCode: code });
  }
}

