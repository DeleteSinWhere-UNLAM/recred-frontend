import { Injectable, computed, signal } from '@angular/core';
import { Producto } from '../../buffet/models/producto.model';
import { ItemCarrito } from '../models/carrito.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly itemsState = signal<ItemCarrito[]>([]);

  readonly items = this.itemsState.asReadonly();

  readonly cantidadTotal = computed(() =>
    this.itemsState().reduce((acc, item) => acc + item.cantidad, 0),
  );

  readonly totalARS = computed(() =>
    this.itemsState().reduce(
      (acc, item) => acc + item.producto.precio * item.cantidad,
      0,
    ),
  );

  readonly itemsPorAlumno = computed<Map<string, ItemCarrito[]>>(() => {
    const mapa = new Map<string, ItemCarrito[]>();
    for (const item of this.itemsState()) {
      const grupo = mapa.get(item.alumnoId) ?? [];
      grupo.push(item);
      mapa.set(item.alumnoId, grupo);
    }
    return mapa;
  });

  cantidadDe(productoId: string, alumnoId: string): number {
    return this.itemsState()
      .filter((i) => i.producto.id === productoId && i.alumnoId === alumnoId)
      .reduce((acc, i) => acc + i.cantidad, 0);
  }

  subtotalAlumno(alumnoId: string): number {
    return this.itemsState()
      .filter((i) => i.alumnoId === alumnoId)
      .reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0);
  }

  agregar(producto: Producto, alumnoId: string, cantidad = 1): void {
    if (cantidad <= 0) return;
    this.itemsState.update((items) => {
      const existente = items.find(
        (i) => i.producto.id === producto.id && i.alumnoId === alumnoId,
      );
      if (existente) {
        return items.map((i) =>
          i === existente ? { ...i, cantidad: i.cantidad + cantidad } : i,
        );
      }
      return [
        ...items,
        {
          id: `${alumnoId}__${producto.id}__${Date.now()}`,
          alumnoId,
          producto,
          cantidad,
        },
      ];
    });
  }

  setCantidad(itemId: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.quitar(itemId);
      return;
    }
    this.itemsState.update((items) =>
      items.map((i) => (i.id === itemId ? { ...i, cantidad } : i)),
    );
  }

  cambiarCantidad(itemId: string, delta: number): void {
    const item = this.itemsState().find((i) => i.id === itemId);
    if (!item) return;
    this.setCantidad(itemId, item.cantidad + delta);
  }

  quitar(itemId: string): void {
    this.itemsState.update((items) => items.filter((i) => i.id !== itemId));
  }

  limpiarAlumno(alumnoId: string): void {
    this.itemsState.update((items) =>
      items.filter((i) => i.alumnoId !== alumnoId),
    );
  }

  limpiar(): void {
    this.itemsState.set([]);
  }
}
