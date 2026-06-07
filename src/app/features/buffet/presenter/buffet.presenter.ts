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

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
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

  readonly productosFiltrados = computed<Producto[]>(() => {
    const { busqueda, categoriaId, clasificacionId, soloFavoritos } = this.filtrosState();
    const texto = busqueda.trim().toLowerCase();
    const favs = this.favoritosState();

    return this.productosState().filter((producto) => {
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
    
    // Carga dinámica de productos
    this.buffetService.getProductosDelBuffet(buffet.id, alumnoId).subscribe({
      next: (productos) => {
        this.productosState.set(productos);
        this.categoriasState.set(this.extractUniqueCategories(productos));
        this.clasificacionesState.set(this.extractUniqueClassifications(productos));
      },
      error: (err) => {
        console.error('Error loading products for buffet:', err);
      }
    });

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
