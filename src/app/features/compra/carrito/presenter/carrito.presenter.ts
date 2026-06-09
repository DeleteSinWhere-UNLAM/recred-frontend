import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, tap } from 'rxjs';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { ItemCarrito } from '../../models/carrito.model';
import { SugerenciaCarrito } from '../../models/sugerencia-carrito.model';
import {
  OrdenAlumno,
  Recreo,
} from '../../models/orden-compra.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { BuffetService } from '../../../buffet/services/buffet.service';
import { SugerenciasCarritoService } from '../../services/sugerencias-carrito.service';
import { CarritoService } from '../../services/carrito.service';
import { CompraService } from '../../services/compra.service';
import { Buffet } from '../../../buffet/models/buffet.model';
import { Producto } from '../../../buffet/models/producto.model';
import { ToastService } from '../../../../shared/services/toast.service';

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
  private readonly perfilService = inject(PerfilService);
  private readonly buffetService = inject(BuffetService);
  private readonly sugerenciasCarritoService = inject(SugerenciasCarritoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private readonly seleccionState = signal<Record<string, boolean>>({});
  private readonly fechasState = signal<Record<string, string>>({});
  private readonly recreosState = signal<Record<string, Recreo>>({});

  private readonly sugerenciasState = signal<SugerenciaCarrito[]>([]);
  private readonly cargandoSugerenciasState = signal(false);
  private readonly buffetCache = new Map<string, Buffet>();

  readonly sugerencias: Signal<SugerenciaCarrito[]> = this.sugerenciasState.asReadonly();
  readonly cargandoSugerencias: Signal<boolean> = this.cargandoSugerenciasState.asReadonly();
  readonly mostrarSugerencias = computed(
    () =>
      this.perfilService.rol() === 'ALUMNO' || this.usuarioService.esVistaAlumno(),
  );

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

  constructor() {
    effect(() => {
      if (!this.mostrarSugerencias()) {
        this.sugerenciasState.set([]);
        return;
      }
      this.refrescarSugerencias();
    });
  }

  private refrescarSugerencias(): void {
    const grupo = this.grupos()[0];
    if (!grupo) {
      this.sugerenciasState.set([]);
      return;
    }
    const studentId = this.perfilService.obtenerAlumnoId() ?? grupo.alumno.id;
    if (!studentId) {
      this.sugerenciasState.set([]);
      return;
    }

    const itemsRequest = grupo.items.map((i) => ({
      productId: i.producto.id,
      quantity: i.cantidad,
    }));

    this.resolverBuffet(studentId).subscribe({
      next: (buffet) => {
        this.cargandoSugerenciasState.set(true);
        this.sugerenciasCarritoService
          .obtenerSugerencias({
            studentId,
            buffetId: buffet.id,
            items: itemsRequest,
            limit: 3,
          })
          .subscribe({
            next: (resultado) => {
              this.sugerenciasState.set(resultado);
              this.cargandoSugerenciasState.set(false);
            },
            error: (err) => {
              console.error('Error al obtener sugerencias de carrito:', err);
              this.sugerenciasState.set([]);
              this.cargandoSugerenciasState.set(false);
            },
          });
      },
      error: (err) => {
        console.error('Error al resolver buffet del alumno:', err);
        this.sugerenciasState.set([]);
        this.cargandoSugerenciasState.set(false);
      },
    });
  }

  private resolverBuffet(alumnoId: string) {
    const cacheado = this.buffetCache.get(alumnoId);
    if (cacheado) {
      return of(cacheado);
    }
    return this.buffetService.obtenerBuffetDelAlumno(alumnoId).pipe(
      tap((buffet) => this.buffetCache.set(alumnoId, buffet)),
    );
  }

  agregarSugerencia(sugerencia: SugerenciaCarrito): void {
    const grupo = this.grupos()[0];
    if (!grupo) return;
    const producto: Producto = {
      id: sugerencia.productId,
      nombre: sugerencia.productName,
      descripcion: '',
      precio: sugerencia.price,
      categoria: { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: sugerencia.stockActual > 0 ? 'DISPONIBLE' : 'SIN_STOCK',
    };
    this.carritoService.agregar(producto, grupo.alumno.id, 1);
    this.toastService.mostrar(
      `Se agregó "${producto.nombre}" al carrito`,
    );
  }

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
