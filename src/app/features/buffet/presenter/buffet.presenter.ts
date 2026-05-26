import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../core/models/alumno.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { BuffetService } from '../data/buffet.service';
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
}

const filtrosPorDefecto: FiltrosBuffet = {
  busqueda: '',
  categoriaId: 'todas',
  clasificacionId: 'todas',
};

@Injectable()
export class BuffetPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly buffetService = inject(BuffetService);
  private readonly router = inject(Router);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly buffetState = signal<Buffet | undefined>(undefined);
  private readonly productosState = signal<Producto[]>([]);
  private readonly categoriasState = signal<CategoriaProducto[]>([]);
  private readonly clasificacionesState = signal<ClasificacionSalud[]>([]);
  private readonly filtrosState = signal<FiltrosBuffet>({ ...filtrosPorDefecto });

  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly buffet: Signal<Buffet | undefined> = this.buffetState.asReadonly();
  readonly productos: Signal<Producto[]> = this.productosState.asReadonly();
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

  readonly productosFiltrados = computed<Producto[]>(() => {
    const { busqueda, categoriaId, clasificacionId } = this.filtrosState();
    const texto = busqueda.trim().toLowerCase();

    return this.productosState().filter((producto) => {
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
      this.router.navigateByUrl('/');
      return;
    }

    const buffet = this.buffetService.getBuffetDelAlumno(alumno.colegioId);
    if (!buffet) {
      this.router.navigateByUrl('/');
      return;
    }

    this.alumnoState.set(alumno);
    this.buffetState.set(buffet);
    this.productosState.set(this.buffetService.getProductosDelBuffet(buffet.id));
    this.categoriasState.set(this.buffetService.getCategorias(buffet.id));
    this.clasificacionesState.set(this.buffetService.getClasificacionesSalud(buffet.id));
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

  limpiarFiltros(): void {
    this.filtrosState.set({ ...filtrosPorDefecto });
  }

  volver(): void {
    this.router.navigateByUrl('/');
  }

  agregarAlCarrito(producto: Producto): void {
    console.info('[Buffet] agregar', producto);
  }
}
