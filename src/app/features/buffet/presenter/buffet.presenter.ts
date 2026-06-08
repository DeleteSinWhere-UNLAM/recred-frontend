import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { CarritoService } from '../../compra/services/carrito.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { ToastService } from '../../../shared/services/toast.service';
import { BuffetService } from '../services/buffet.service';
import { FavoritosService } from '../../favoritos/services/favoritos.service';
import { Buffet } from '../models/buffet.model';
import {
  CategoriaProducto,
  ClasificacionSalud,
  Producto,
} from '../models/producto.model';
import { RestriccionProductoService } from '../../restriccion-producto/services/restriccion-producto.service';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { Presupuesto, PrediccionGasto } from '../../presupuesto/models/presupuesto.model';

export interface FiltrosBuffet {
  busqueda: string;
  categoriaId: string | 'todas';
  clasificacionId: string | 'todas';
  soloFavoritos: boolean;
}

const filtrosPorDefecto: FiltrosBuffet = {
  busqueda: '',
  categoriaId: 'todas',
  clasificacionId: 'todas',
  soloFavoritos: false,
};

@Injectable()
export class BuffetPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly buffetService = inject(BuffetService);
  private readonly favoritosService = inject(FavoritosService);
  private readonly carritoService = inject(CarritoService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly restriccionProductoService = inject(RestriccionProductoService);
  private readonly presupuestoService = inject(PresupuestoService);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly activeBudgetState = signal<Presupuesto | undefined>(undefined);
  private readonly currentSpendingState = signal<PrediccionGasto | undefined>(undefined);
  private readonly buffetState = signal<Buffet | undefined>(undefined);
  private readonly productosState = signal<Producto[]>([]);
  private readonly favoritosState = signal<Set<string>>(new Set());
  private readonly categoriasState = signal<CategoriaProducto[]>([]);
  private readonly clasificacionesState = signal<ClasificacionSalud[]>([]);
  private readonly filtrosState = signal<FiltrosBuffet>({ ...filtrosPorDefecto });

  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly buffet: Signal<Buffet | undefined> = this.buffetState.asReadonly();
  readonly productos: Signal<Producto[]> = this.productosState.asReadonly();
  readonly favoritos: Signal<Set<string>> = this.favoritosState.asReadonly();
  readonly categorias: Signal<CategoriaProducto[]> = this.categoriasState.asReadonly();
  readonly clasificaciones: Signal<ClasificacionSalud[]> =
    this.clasificacionesState.asReadonly();
  readonly filtros: Signal<FiltrosBuffet> = this.filtrosState.asReadonly();

  readonly nombreCompleto = computed(() => {
    const alumno = this.alumnoState();
    return alumno ? `${alumno.nombre} ${alumno.apellido}` : '';
  });

  readonly iniciales = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    return ((alumno.nombre[0] ?? '') + (alumno.apellido[0] ?? '')).toUpperCase();
  });

  readonly grado = computed(() => this.alumnoState()?.grado ?? '');

  readonly saldo = computed(() => this.alumnoState()?.saldo ?? 0);

  readonly nombreColegio = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    return (
      this.colegiosService
        .getColegios()
        .find((c) => c.id === alumno.colegioId)?.nombre ?? ''
    );
  });

  private readonly cartItemsForStudent = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return [];
    return this.carritoService.items().filter((i) => i.alumnoId === alumno.id);
  });

  readonly cartTotalForStudent = computed(() => {
    return this.cartItemsForStudent().reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  });

  readonly cartTotalByCategoryForStudent = computed(() => {
    const mapa = new Map<string, number>();
    for (const item of this.cartItemsForStudent()) {
      const catId = item.producto.categoria.id;
      const actual = mapa.get(catId) ?? 0;
      mapa.set(catId, actual + item.producto.precio * item.cantidad);
    }
    return mapa;
  });

  readonly remainingGeneralBudget = computed(() => {
    const budget = this.activeBudgetState();
    if (!budget || !budget.activo) return null;
    const spending = this.currentSpendingState();
    const spent = spending ? spending.gastoActual : 0;
    return Math.max(0, budget.montoLimiteGeneral - spent);
  });

  readonly remainingCategoryBudgets = computed(() => {
    const mapa = new Map<string, number>();
    const budget = this.activeBudgetState();
    if (!budget || !budget.activo) return mapa;
    const spending = this.currentSpendingState();

    for (const regla of budget.reglasCategoria) {
      if (regla.activo) {
        const spentObj = spending?.categoriasMasConsumidas?.find((c) => {
          const descC = c.descripcion.trim().toLowerCase();
          const descR = regla.descripcionCategoria.trim().toLowerCase();
          return descC === descR || descC.includes(descR) || descR.includes(descC);
        });
        const spent = spentObj ? spentObj.montoTotal : 0;
        mapa.set(regla.categoriaId, Math.max(0, regla.montoLimiteCalculado - spent));
      }
    }
    return mapa;
  });

  readonly productosConPresupuesto = computed<Producto[]>(() => {
    const productos = this.productosState();
    const budget = this.activeBudgetState();
    if (!budget || !budget.activo) return productos;

    const remainingGeneral = this.remainingGeneralBudget() ?? Infinity;
    const remainingCats = this.remainingCategoryBudgets();
    const cartTotal = this.cartTotalForStudent();
    const cartCats = this.cartTotalByCategoryForStudent();

    return productos.map((p) => {
      // General budget check
      const totalConProducto = cartTotal + p.precio;
      if (totalConProducto > remainingGeneral) {
        return {
          ...p,
          estadoStock: 'SIN_STOCK',
          motivoBloqueo: 'Supera el límite de gasto'
        };
      }

      // Category budget check
      const regla = budget.reglasCategoria.find((r) =>
        r.activo && (
          p.categoria.id === r.categoriaId ||
          p.categoria.descripcion.toLowerCase().includes(r.descripcionCategoria.toLowerCase()) ||
          r.descripcionCategoria.toLowerCase().includes(p.categoria.descripcion.toLowerCase())
        )
      );

      if (regla) {
        const remainingCat = remainingCats.get(regla.categoriaId) ?? regla.montoLimiteCalculado;
        let cartCatSubtotal = 0;
        for (const [catId, total] of cartCats.entries()) {
          const catObj = this.categorias().find((c) => c.id === catId);
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

        const totalCatConProducto = cartCatSubtotal + p.precio;
        if (totalCatConProducto > remainingCat) {
          return {
            ...p,
            estadoStock: 'SIN_STOCK',
            motivoBloqueo: 'Supera límite de su categoría'
          };
        }
      }

      return p;
    });
  });

  readonly productosFiltrados = computed<Producto[]>(() => {
    const { busqueda, categoriaId, clasificacionId, soloFavoritos } = this.filtrosState();
    const texto = busqueda.trim().toLowerCase();
    const favs = this.favoritosState();
    const esAlumno = this.usuarioService.esVistaAlumno();

    return this.productosConPresupuesto().filter((producto) => {
      if (esAlumno && producto.bloqueado) {
        return false;
      }
      if (soloFavoritos && !favs.has(producto.id)) {
        return false;
      }
      if (texto && !producto.nombre.toLowerCase().includes(texto)) {
        return false;
      }
      if (categoriaId !== 'todas' && producto.categoria.id !== categoriaId) {
        return false;
      }
      if (
        clasificacionId !== 'todas' &&
        !producto.clasificacionesSalud.some((c) => c.id === clasificacionId)
      ) {
        return false;
      }
      return true;
    });
  });

  init(alumnoId: string): void {
    const alumno = this.alumnosService.getAlumnoById(alumnoId);
    if (!alumno) {
      this.router.navigateByUrl(this.usuarioService.homeUrl());
      return;
    }

    const buffet = this.buffetService.getBuffetDelAlumno(alumno.colegioId);
    if (!buffet) {
      this.router.navigateByUrl(this.usuarioService.homeUrl());
      return;
    }

    this.alumnoState.set(alumno);
    this.buffetState.set(buffet);
    
    // Reset budget states
    this.activeBudgetState.set(undefined);
    this.currentSpendingState.set(undefined);

    // Carga de presupuesto activo y consumo acumulado
    this.presupuestoService.getPresupuesto(alumnoId).then((budget) => {
      this.activeBudgetState.set(budget);
      if (budget && budget.activo) {
        this.presupuestoService.cargarPrediccion(alumnoId, budget.periodo).then((spending) => {
          this.currentSpendingState.set(spending);
        }).catch((err) => {
          console.error('[Buffet] Error loading spending prediction:', err);
        });
      }
    }).catch((err) => {
      console.error('[Buffet] Error loading budget:', err);
    });

    // Carga dinámica de productos
    this.cargarProductos(buffet.id, alumnoId);

    // Carga de favoritos del alumno
    this.favoritosService.getFavoritos(alumnoId).subscribe({
      next: (favs) => {
        const ids = new Set(favs.map((f) => f.id));
        this.favoritosState.set(ids);
      },
      error: (err) => {
        console.error('Error loading favorites:', err);
      }
    });

    this.filtrosState.set({ ...filtrosPorDefecto });
  }

  private cargarProductos(buffetId: string, alumnoId: string): void {
    this.buffetService.getProductosDelBuffet(buffetId, alumnoId).subscribe({
      next: (productos) => {
        this.productosState.set(productos);
        this.categoriasState.set(this.extractUniqueCategories(productos));
        this.clasificacionesState.set(this.extractUniqueClassifications(productos));
      },
      error: (err) => {
        console.error('Error loading products for buffet:', err);
      }
    });
  }

  buscar(texto: string): void {
    this.filtrosState.update((actual) => ({ ...actual, busqueda: texto }));
  }

  seleccionarCategoria(categoriaId: string | 'todas'): void {
    this.filtrosState.update((actual) => ({ ...actual, categoriaId }));
  }

  seleccionarClasificacion(clasificacionId: string | 'todas'): void {
    this.filtrosState.update((actual) => ({ ...actual, clasificacionId }));
  }

  toggleSoloFavoritos(): void {
    this.filtrosState.update((actual) => ({ ...actual, soloFavoritos: !actual.soloFavoritos }));
  }

  limpiarFiltros(): void {
    this.filtrosState.set({ ...filtrosPorDefecto });
  }

  volver(): void {
    this.router.navigateByUrl(this.usuarioService.homeUrl());
  }

  cambiarAlumno(nuevoAlumnoId: string): void {
    if (!nuevoAlumnoId || nuevoAlumnoId === this.alumnoState()?.id) return;
    this.init(nuevoAlumnoId);
    this.router.navigate(['/buffet', nuevoAlumnoId]);
  }

  agregarAlCarrito(producto: Producto, cantidad = 1): void {
    const alumno = this.alumnoState();
    if (!alumno) return;
    this.carritoService.agregar(producto, alumno.id, cantidad);
    const verbo = cantidad === 1 ? 'Se agregó' : 'Se agregaron';
    this.toastService.mostrar(
      `${verbo} ${cantidad}x "${producto.nombre}" al carrito`,
    );
  }

  toggleFavorito(producto: Producto): void {
    const alumno = this.alumnoState();
    if (!alumno) return;

    const ids = new Set(this.favoritosState());
    if (ids.has(producto.id)) {
      ids.delete(producto.id);
      this.favoritosState.set(ids);
      this.favoritosService.removerFavorito(alumno.id, producto.id).subscribe({
        next: () => this.toastService.mostrar(`Se quitó "${producto.nombre}" de tus favoritos`, 'success'),
        error: (err) => console.error('Error removing favorite:', err)
      });
    } else {
      ids.add(producto.id);
      this.favoritosState.set(ids);
      this.favoritosService.agregarFavorito(alumno.id, producto).subscribe({
        next: () => this.toastService.mostrar(`Se agregó "${producto.nombre}" a tus favoritos`, 'success'),
        error: (err) => console.error('Error adding favorite:', err)
      });
    }
  }

  toggleLock(producto: Producto): void {
    const alumno = this.alumnoState();
    if (!alumno) return;
    const buffet = this.buffetState();
    if (!buffet) return;

    const origBloqueado = !!producto.bloqueado;
    const origMotivo = producto.motivoBloqueo;
    const origEstadoStock = producto.estadoStock;

    const nuevoBloqueado = !origBloqueado;
    let nuevoMotivo = origMotivo;
    let nuevoEstadoStock = origEstadoStock;

    if (nuevoBloqueado) {
      nuevoMotivo = 'Bloqueado por el tutor';
      nuevoEstadoStock = 'SIN_STOCK';
    } else {
      if (!origMotivo || origMotivo === 'Bloqueado por el tutor') {
        nuevoMotivo = undefined;
        nuevoEstadoStock = 'DISPONIBLE';
      }
    }

    producto.bloqueado = nuevoBloqueado;
    producto.motivoBloqueo = nuevoMotivo;
    producto.estadoStock = nuevoEstadoStock;
    
    this.productosState.update((productos) =>
      productos.map((p) => (p.id === producto.id ? { 
        ...p, 
        bloqueado: nuevoBloqueado,
        motivoBloqueo: nuevoMotivo,
        estadoStock: nuevoEstadoStock
      } : p))
    );

    if (origBloqueado) {
      this.restriccionProductoService.desbloquearProducto(alumno.id, producto.id).subscribe({
        next: () => {
          this.toastService.mostrar(`Se desbloqueó "${producto.nombre}"`, 'success');
          this.cargarProductos(buffet.id, alumno.id);
        },
        error: (err) => {
          console.error('Error unlocking product:', err);
          producto.bloqueado = origBloqueado;
          producto.motivoBloqueo = origMotivo;
          producto.estadoStock = origEstadoStock;
          this.productosState.update((productos) =>
            productos.map((p) => (p.id === producto.id ? { 
              ...p, 
              bloqueado: origBloqueado,
              motivoBloqueo: origMotivo,
              estadoStock: origEstadoStock
            } : p))
          );
          this.toastService.mostrar('Error al desbloquear el producto', 'error');
        }
      });
    } else {
      this.restriccionProductoService.bloquearProducto(alumno.id, producto.id).subscribe({
        next: () => {
          this.toastService.mostrar(`Se bloqueó "${producto.nombre}"`, 'success');
          this.cargarProductos(buffet.id, alumno.id);
        },
        error: (err) => {
          console.error('Error blocking product:', err);
          producto.bloqueado = origBloqueado;
          producto.motivoBloqueo = origMotivo;
          producto.estadoStock = origEstadoStock;
          this.productosState.update((productos) =>
            productos.map((p) => (p.id === producto.id ? { 
              ...p, 
              bloqueado: origBloqueado,
              motivoBloqueo: origMotivo,
              estadoStock: origEstadoStock
            } : p))
          );
          this.toastService.mostrar('Error al bloquear el producto', 'error');
        }
      });
    }
  }

  private extractUniqueCategories(productos: Producto[]): CategoriaProducto[] {
    const porId = new Map<string, CategoriaProducto>();
    for (const p of productos) {
      if (p.categoria) {
        porId.set(p.categoria.id, p.categoria);
      }
    }
    return [...porId.values()];
  }

  private extractUniqueClassifications(productos: Producto[]): ClasificacionSalud[] {
    const porId = new Map<string, ClasificacionSalud>();
    for (const p of productos) {
      if (p.clasificacionesSalud) {
        for (const c of p.clasificacionesSalud) {
          porId.set(c.id, c);
        }
      }
    }
    return [...porId.values()];
  }
}
