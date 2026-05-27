import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { ItemCarrito } from '../../models/carrito.model';
import {
  OrdenAlumno,
  Recreo,
} from '../../models/orden-compra.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { CarritoService } from '../../data/carrito.service';
import { CompraService } from '../../data/compra.service';

export interface GrupoCarrito {
  alumno: Alumno;
  items: ItemCarrito[];
  subtotal: number;
  seleccionado: boolean;
  fecha: string;
  recreo: Recreo;
}

@Injectable()
export class CarritoPresenter {
  private readonly carritoService = inject(CarritoService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly compraService = inject(CompraService);
  private readonly router = inject(Router);

  private readonly seleccionState = signal<Record<string, boolean>>({});
  private readonly fechasState = signal<Record<string, string>>({});
  private readonly recreosState = signal<Record<string, Recreo>>({});

  readonly fechaMinima = this.calcularFechaMinima();

  readonly grupos: Signal<GrupoCarrito[]> = computed(() => {
    const mapa = this.carritoService.itemsPorAlumno();
    const seleccion = this.seleccionState();
    const fechas = this.fechasState();
    const recreos = this.recreosState();

    const lista: GrupoCarrito[] = [];
    for (const [alumnoId, items] of mapa) {
      const alumno = this.alumnosService.getAlumnoById(alumnoId);
      if (!alumno) continue;
      const subtotal = items.reduce(
        (acc, i) => acc + i.producto.precio * i.cantidad,
        0,
      );
      lista.push({
        alumno,
        items,
        subtotal,
        seleccionado: seleccion[alumnoId] ?? true,
        fecha: fechas[alumnoId] ?? this.fechaMinima,
        recreo: recreos[alumnoId] ?? 'PRIMER_RECREO',
      });
    }
    return lista;
  });

  readonly carritoVacio = computed(() => this.grupos().length === 0);

  readonly totalSeleccionado = computed(() =>
    this.grupos()
      .filter((g) => g.seleccionado)
      .reduce((acc, g) => acc + g.subtotal, 0),
  );

  readonly haySeleccion = computed(() =>
    this.grupos().some((g) => g.seleccionado),
  );

  readonly hayFechaFaltante = computed(() =>
    this.grupos().some((g) => g.seleccionado && !g.fecha),
  );

  readonly avanzarPosible = computed(
    () => this.haySeleccion() && !this.hayFechaFaltante(),
  );

  readonly advertencia = computed<string | null>(() => {
    const conDeuda = this.grupos().filter(
      (g) => g.seleccionado && g.alumno.saldo < g.subtotal,
    );
    if (conDeuda.length === 0) return null;
    if (conDeuda.length === 1) {
      return `El saldo de ${conDeuda[0].alumno.nombre} no alcanza para este pedido.`;
    }
    return `Hay ${conDeuda.length} alumnos con saldo insuficiente.`;
  });

  toggleSeleccion(alumnoId: string): void {
    this.seleccionState.update((actual) => ({
      ...actual,
      [alumnoId]: !(actual[alumnoId] ?? true),
    }));
  }

  setFecha(alumnoId: string, fecha: string): void {
    this.fechasState.update((actual) => ({ ...actual, [alumnoId]: fecha }));
  }

  setRecreo(alumnoId: string, recreo: Recreo): void {
    this.recreosState.update((actual) => ({ ...actual, [alumnoId]: recreo }));
  }

  sumarItem(itemId: string): void {
    this.carritoService.cambiarCantidad(itemId, 1);
  }

  restarItem(itemId: string): void {
    this.carritoService.cambiarCantidad(itemId, -1);
  }

  eliminarItem(itemId: string): void {
    this.carritoService.quitar(itemId);
  }

  avanzar(): void {
    if (!this.avanzarPosible()) return;
    const ordenes: OrdenAlumno[] = this.grupos()
      .filter((g) => g.seleccionado)
      .map((g) => ({
        alumno: g.alumno,
        items: g.items,
        fecha: g.fecha,
        recreo: g.recreo,
        subtotal: g.subtotal,
      }));
    this.compraService.iniciarOrden(ordenes);
    this.router.navigateByUrl('/compra/confirmar');
  }

  volverAlBuffet(): void {
    this.router.navigateByUrl('/');
  }

  private calcularFechaMinima(): string {
    // TODO: validar feriados/fines de semana cuando exista endpoint
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
