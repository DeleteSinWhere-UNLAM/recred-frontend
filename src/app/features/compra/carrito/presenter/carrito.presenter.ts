import { Injectable, Signal, computed, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { ItemCarrito } from '../../models/carrito.model';
import {
  OrdenAlumno,
  Recreo,
} from '../../models/orden-compra.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { CarritoService } from '../../services/carrito.service';
import { CompraService } from '../../services/compra.service';
import { PresupuestoService } from '../../../presupuesto/services/presupuesto.service';
import { Presupuesto, PrediccionGasto, CategoriaConsumida } from '../../../presupuesto/models/presupuesto.model';

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
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly presupuestoService = inject(PresupuestoService);

  private readonly seleccionState = signal<Record<string, boolean>>({});
  private readonly fechasState = signal<Record<string, string>>({});
  private readonly recreosState = signal<Record<string, Recreo>>({});
  private readonly presupuestosState = signal<Record<string, Presupuesto>>({});
  private readonly prediccionesState = signal<Record<string, PrediccionGasto>>({});

  constructor() {
    effect(() => {
      const mapa = this.carritoService.itemsPorAlumno();
      const presupuestos = this.presupuestosState();
      for (const studentId of mapa.keys()) {
        if (!presupuestos[studentId]) {
          this.cargarDatosPresupuesto(studentId);
        }
      }
    });
  }

  private async cargarDatosPresupuesto(studentId: string): Promise<void> {
    try {
      const budget = await this.presupuestoService.getPresupuesto(studentId);
      if (budget) {
        this.presupuestosState.update((prev) => ({ ...prev, [studentId]: budget }));
        if (budget.activo) {
          const spending = await this.presupuestoService.cargarPrediccion(studentId, budget.periodo);
          if (spending) {
            this.prediccionesState.update((prev) => ({ ...prev, [studentId]: spending }));
          }
        }
      }
    } catch (err) {
      console.error('[CarritoPresenter] Error loading budget for student:', studentId, err);
    }
  }

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

  readonly erroresPresupuestoPorAlumno = computed<Record<string, string>>(() => {
    const mapaErrores: Record<string, string> = {};
    const grupos = this.grupos();
    const presupuestos = this.presupuestosState();
    const predicciones = this.prediccionesState();

    for (const g of grupos) {
      if (!g.seleccionado) continue;
      const budget = presupuestos[g.alumno.id];
      if (!budget || !budget.activo) continue;

      const spending = predicciones[g.alumno.id];
      const spentGeneral = spending ? spending.gastoActual : 0;
      const remainingGeneral = Math.max(0, budget.montoLimiteGeneral - spentGeneral);

      // Check general budget limit
      if (g.subtotal > remainingGeneral) {
        mapaErrores[g.alumno.id] = `Supera el límite de gasto diario disponible (Disponible: $${remainingGeneral}).`;
        continue;
      }

      // Check category budget limits
      const cartCats = new Map<string, number>();
      for (const item of g.items) {
        const catId = item.producto.categoria.id;
        const actual = cartCats.get(catId) ?? 0;
        cartCats.set(catId, actual + item.producto.precio * item.cantidad);
      }

      for (const regla of budget.reglasCategoria) {
        if (regla.activo) {
          const spentObj = spending?.categoriasMasConsumidas?.find((c: CategoriaConsumida) => {
            const descC = c.descripcion.trim().toLowerCase();
            const descR = regla.descripcionCategoria.trim().toLowerCase();
            return descC === descR || descC.includes(descR) || descR.includes(descC);
          });
          const spentCat = spentObj ? spentObj.montoTotal : 0;
          const remainingCat = Math.max(0, regla.montoLimiteCalculado - spentCat);

          let cartCatSubtotal = 0;
          for (const [catId, total] of cartCats.entries()) {
            const catObj = g.items.find((i) => i.producto.categoria.id === catId)?.producto.categoria;
            if (
              catId === regla.categoriaId ||
              (catObj && (
                catObj.descripcion.toLowerCase().includes(regla.descripcionCategoria.toLowerCase()) ||
                regla.descripcionCategoria.toLowerCase().includes(catObj.descripcion.toLowerCase())
              ))
            ) {
              cartCatSubtotal += total;
            }
          }

          if (cartCatSubtotal > remainingCat) {
            mapaErrores[g.alumno.id] = `Supera el límite para la categoría "${regla.descripcionCategoria}" (Disponible: $${remainingCat}).`;
            break;
          }
        }
      }
    }

    return mapaErrores;
  });

  readonly erroresPresupuestoLista = computed<string[]>(() =>
    Object.values(this.erroresPresupuestoPorAlumno())
  );

  readonly avanzarPosible = computed(
    () => this.haySeleccion() && !this.hayFechaFaltante() && this.erroresPresupuestoLista().length === 0,
  );

  readonly advertencia = computed<string | null>(() => {
    const budgetErrors = this.erroresPresupuestoLista();
    if (budgetErrors.length > 0) {
      return budgetErrors.join(' ');
    }

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
    this.router.navigateByUrl(this.usuarioService.homeUrl());
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
