import { Injectable, computed, signal, inject } from '@angular/core';
import { Producto } from '../../buffet/models/producto.model';
import { ItemCarrito } from '../models/carrito.model';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { Presupuesto } from '../../presupuesto/models/presupuesto.model';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { Movimiento } from '../../movimientos/models/movimiento.model';
import { getPeriodRange, getProductCategory, isSameCategory } from '../utils/budget-helpers';
import { firstValueFrom } from 'rxjs';
import { Recreo } from '../models/orden-compra.model';

export interface SeleccionRetiro {
  fecha: string;
  recreo: Recreo;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly movimientosService = inject(MovimientosService);

  private readonly itemsState = signal<ItemCarrito[]>([]);
  private readonly budgetsState = signal<Map<string, Presupuesto>>(new Map());
  private readonly purchasesState = signal<Map<string, Movimiento[]>>(new Map());
  private readonly seleccionRetiroState = signal<Record<string, SeleccionRetiro>>({});
  private catalog: Producto[] = [];

  readonly items = this.itemsState.asReadonly();
  readonly budgets = this.budgetsState.asReadonly();
  readonly purchases = this.purchasesState.asReadonly();
  readonly seleccionRetiro = this.seleccionRetiroState.asReadonly();

  setSeleccionRetiro(alumnoId: string, fecha: string, recreo: Recreo): void {
    this.seleccionRetiroState.update((current) => ({
      ...current,
      [alumnoId]: { fecha, recreo },
    }));
  }

  getSeleccionRetiro(alumnoId: string): SeleccionRetiro | undefined {
    return this.seleccionRetiroState()[alumnoId];
  }

  clearSeleccionRetiro(alumnoId: string): void {
    this.seleccionRetiroState.update((current) => {
      const next = { ...current };
      delete next[alumnoId];
      return next;
    });
  }

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

  setCatalog(productos: Producto[]): void {
    this.catalog = productos;
  }

  async cargarPresupuestoYConsumo(alumnoId: string): Promise<void> {
    if (!alumnoId) return;
    try {
      const [budget, history] = await Promise.all([
        this.presupuestoService.getPresupuesto(alumnoId),
        firstValueFrom(this.movimientosService.getHistorialAlumno(alumnoId)),
      ]);

      this.budgetsState.update((map) => {
        const next = new Map(map);
        if (budget) {
          next.set(alumnoId, budget);
        } else {
          next.delete(alumnoId);
        }
        return next;
      });

      this.purchasesState.update((map) => {
        const next = new Map(map);
        if (history) {
          next.set(alumnoId, history);
        } else {
          next.delete(alumnoId);
        }
        return next;
      });
    } catch (err) {
      console.error('Error preloading budget/purchases for alumno:', alumnoId, err);
    }
  }

  puedeAgregar(producto: Producto, alumnoId: string, cantidadAdicional: number): boolean {
    console.log('[DEBUG puedeAgregar]', {
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoPrecio: producto.precio,
      productoCategoria: producto.categoria,
      alumnoId,
      cantidadAdicional
    });

    if (producto.superaPresupuesto) {
      console.log('[DEBUG puedeAgregar] producto.superaPresupuesto is true');
      return false;
    }

    const budget = this.budgetsState().get(alumnoId);
    console.log('[DEBUG puedeAgregar] Loaded budget:', budget);
    if (!budget || !budget.activo) {
      console.log('[DEBUG puedeAgregar] No budget found or inactive');
      return true;
    }

    const seleccion = this.seleccionRetiroState()[alumnoId];
    const referenceDate = seleccion?.fecha ? new Date(seleccion.fecha + 'T12:00:00') : new Date();
    const { start, end } = getPeriodRange(budget.periodo, referenceDate);

    // Sum past approved purchases in the current range
    const pastPurchases = this.purchasesState().get(alumnoId) ?? [];
    const activeStatuses = ['APPROVED', 'PENDING', 'PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];
    const approvedPastPurchases = pastPurchases.filter((m) => {
      if (!activeStatuses.includes(m.status)) return false;
      const purchaseDate = m.pickupDate ? new Date(m.pickupDate + 'T12:00:00') : new Date(m.date);
      return purchaseDate >= start && purchaseDate <= end;
    });

    let spentPastGeneral = 0;
    let spentPastCategory = 0;

    for (const m of approvedPastPurchases) {
      spentPastGeneral += m.totalAmount;
      for (const item of m.items) {
        const itemCatId = getProductCategory(item.productId, item.productName, this.catalog);
        const catalogProd = this.catalog.find((p) => p.id === item.productId);
        const itemCatDesc = catalogProd?.categoria?.descripcion ?? item.productName;
        if (
          isSameCategory(
            itemCatId,
            itemCatDesc,
            producto.categoria.id,
            producto.categoria.descripcion
          )
        ) {
          spentPastCategory += item.unitPrice * item.quantity;
        }
      }
    }

    // Sum items currently in the cart
    let spentCartGeneral = 0;
    let spentCartCategory = 0;

    const cartItems = this.itemsState().filter((i) => i.alumnoId === alumnoId);
    for (const item of cartItems) {
      const cost = item.producto.precio * item.cantidad;
      spentCartGeneral += cost;
      if (
        isSameCategory(
          item.producto.categoria.id,
          item.producto.categoria.descripcion,
          producto.categoria.id,
          producto.categoria.descripcion
        )
      ) {
        spentCartCategory += cost;
      }
    }

    const additionalCost = producto.precio * cantidadAdicional;

    // Check general budget limit
    const totalGeneral = spentPastGeneral + spentCartGeneral + additionalCost;
    console.log('[DEBUG puedeAgregar] General cost check:', {
      spentPastGeneral,
      spentCartGeneral,
      additionalCost,
      totalGeneral,
      limit: budget.montoLimiteGeneral
    });
    if (totalGeneral > budget.montoLimiteGeneral) {
      console.log('[DEBUG puedeAgregar] Exceeds general budget!');
      return false;
    }

    // Check category budget limit (if applicable)
    const rule = budget.reglasCategoria.find((r) =>
      r.activo &&
      isSameCategory(
        producto.categoria.id,
        producto.categoria.descripcion,
        r.categoriaId,
        r.descripcionCategoria
      )
    );
    console.log('[DEBUG puedeAgregar] Matched rule for category:', producto.categoria.id, rule);
    if (rule) {
      const totalCategory = spentPastCategory + spentCartCategory + additionalCost;
      console.log('[DEBUG puedeAgregar] Category cost check:', {
        spentPastCategory,
        spentCartCategory,
        additionalCost,
        totalCategory,
        limit: rule.montoLimiteCalculado
      });
      if (totalCategory > rule.montoLimiteCalculado) {
        console.log('[DEBUG puedeAgregar] Exceeds category budget!');
        return false;
      }
    }

    return true;
  }
}
