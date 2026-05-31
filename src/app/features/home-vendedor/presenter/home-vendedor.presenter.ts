import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { UsuarioService } from '../../../data-access/services/usuario.service';
import { AccionVendedor } from '../models/accion-vendedor.model';
import { ResumenVendedor } from '../models/resumen-vendedor.model';
import { HomeVendedorService } from '../services/home-vendedor.service';

const formateadorGanancias = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

@Injectable()
export class HomeVendedorPresenter {
  private readonly usuarioService = inject(UsuarioService);
  private readonly homeVendedorService = inject(HomeVendedorService);
  private readonly router = inject(Router);

  private readonly resumenState = signal<ResumenVendedor | undefined>(undefined);
  private readonly nombreVendedorState = signal<string>('');

  readonly nombreVendedor: Signal<string> = this.nombreVendedorState.asReadonly();

  readonly iniciales = computed(() => {
    const partes = this.nombreVendedorState().trim().split(/\s+/);
    const primera = partes[0]?.[0] ?? '';
    const segunda = partes[1]?.[0] ?? partes[0]?.[1] ?? '';
    return (primera + segunda).toUpperCase();
  });

  readonly saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buen día,';
    if (hora < 19) return 'Buenas tardes,';
    return 'Buenas noches,';
  });

  readonly gananciasFormateadas = computed(() =>
    formateadorGanancias.format(this.resumenState()?.gananciasHoy ?? 0),
  );

  readonly ventasHoy = computed(() => this.resumenState()?.ventasHoy ?? 0);

  readonly productosSinStock = computed(
    () => this.resumenState()?.productosSinStock ?? 0,
  );

  readonly acciones: Signal<AccionVendedor[]> = computed(() => [
    {
      id: 'cargar-productos',
      titulo: 'Carga de producto',
      descripcion: 'Subí una foto y lo detectamos',
      icono: 'fa-cloud-arrow-up',
      ruta: '/cargar-producto-ia',
    },
    {
      id: 'dashboard',
      titulo: 'Dashboard',
      descripcion: 'Métricas y reportes',
      icono: 'fa-chart-line',
      ruta: '/dashboard',
      color: 'pizarra',
    },
    {
      id: 'stock',
      titulo: 'Stock',
      descripcion: 'Inventario y reposición',
      icono: 'fa-boxes-stacked',
      ruta: '/stock',
      color: 'menta',
    },
    {
      id: 'sugerencias',
      titulo: 'Sugerencias del día',
      descripcion: 'Recomendaciones inteligentes',
      icono: 'fa-robot',
      ruta: '/sugerencias',
      color: 'dorado',
    },
    {
      id: 'recomendaciones',
      titulo: 'Recomendaciones estacionales',
      descripcion: 'Qué stockear según la temporada',
      icono: 'fa-leaf',
      ruta: '/recomendaciones-estacionales',
      color: 'melocoton',
    },
  ]);

  init(): void {
    this.resumenState.set(this.homeVendedorService.getResumen());
    this.nombreVendedorState.set(this.homeVendedorService.getNombreVendedor());
  }

  ejecutarAccion(accion: AccionVendedor): void {
    this.router.navigateByUrl(accion.ruta);
  }
}
