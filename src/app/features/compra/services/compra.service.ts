import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  OrdenAlumno,
  OrdenCompra,
} from '../models/orden-compra.model';
import {
  AdvancePurchaseRequest,
  BuyerType,
  ComprasApiService,
  OrderRequest,
} from './compras-api.service';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly api = inject(ComprasApiService);
  private readonly perfilService = inject(PerfilService);

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

  procesarPago(): Observable<OrdenCompra> {
    const enCurso = this.ordenEnCursoState();
    if (!enCurso || enCurso.ordenes.length === 0) {
      return throwError(() => new Error('No hay una orden en curso para procesar.'));
    }

    const perfil = this.perfilService.getPerfil();
    if (!perfil) {
      return throwError(() => new Error('No hay un usuario autenticado.'));
    }

    const buyerType: BuyerType = perfil.rol === 'ALUMNO' ? 'STUDENT' : 'TUTOR';
    const orders: OrderRequest[] = enCurso.ordenes.map((o) => ({
      studentId: o.alumno.id,
      buyerId: perfil.id,
      buyerType,
      date: o.fecha,
      recessTime: o.recreo,
      items: o.items.map((i) => ({
        productId: i.producto.id,
        quantity: i.cantidad,
      })),
    }));

    const request: AdvancePurchaseRequest = { orders };

    return this.api.crearAnticipada(request).pipe(
      map((response) => {
        const pagada: OrdenCompra = {
          ...enCurso,
          id: response.orderId,
          total: response.total ?? enCurso.total,
          codigos: response.codes ?? {},
        };
        this.ultimaOrdenState.set(pagada);
        this.ordenEnCursoState.set(null);
        return pagada;
      }),
    );
  }
}
