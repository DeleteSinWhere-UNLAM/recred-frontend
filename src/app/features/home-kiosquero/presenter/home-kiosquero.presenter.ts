import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { AccionKiosquero } from '../models/accion-kiosquero.model';
import { ResumenKiosquero } from '../models/resumen-kiosquero.model';
import { HomeKiosqueroService } from '../services/home-kiosquero.service';

const formateadorGanancias = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

@Injectable()
export class HomeKiosqueroPresenter {
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly homeKiosqueroService = inject(HomeKiosqueroService);
  private readonly router = inject(Router);

  private readonly resumenState = signal<ResumenKiosquero | undefined>(undefined);
  private readonly nombreKiosqueroState = signal<string>('');

  readonly nombreKiosquero: Signal<string> = this.nombreKiosqueroState.asReadonly();

  readonly iniciales = computed(() => {
    const partes = this.nombreKiosqueroState().trim().split(/\s+/);
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

  readonly acciones: Signal<AccionKiosquero[]> = computed(() => [
    {
      id: 'cargar-productos',
      titulo: 'Carga de producto',
      descripcion: 'Subí una foto y lo detectamos',
      icono: 'fa-cloud-arrow-up',
      ruta: '/cargar-producto-ia',
      color: 'dorado',
    },
    {
      id: 'stock',
      titulo: 'Stock',
      descripcion: 'Inventario y reposición',
      icono: 'fa-boxes-stacked',
      ruta: '/admin-productos',
      color: 'violeta',
    },
    {
      id: 'dashboard',
      titulo: 'Panel de control',
      descripcion: 'Métricas y reportes',
      icono: 'fa-chart-line',
      ruta: '/dashboard',
      color: 'pizarra',
    },
    {
      id: 'sugerencias',
      titulo: 'Sugerencias del día',
      descripcion: 'Recomendaciones inteligentes',
      icono: 'fa-robot',
      ruta: '/sugerencias',
      color: 'melocoton',
    },
    {
      id: 'recomendaciones',
      titulo: 'Recomendaciones estacionales',
      descripcion: 'Qué stockear según la temporada',
      icono: 'fa-leaf',
      ruta: '/recomendaciones-estacionales',
      color: 'menta',
    },
    {
      id: 'promociones',
      titulo: 'Promociones',
      descripcion: 'Crear y editar descuentos',
      icono: 'fa-tags',
      ruta: '/promociones',
      color: 'violeta',
    },
  ]);

  init(): void {
    this.resumenState.set(this.homeKiosqueroService.getResumen());
    const perfil = this.perfilService.getPerfil();
    const nombre = perfil
      ? `${perfil.nombre} ${perfil.apellido}`
      : this.homeKiosqueroService.getNombreKiosquero();
    this.nombreKiosqueroState.set(nombre);
  }

  ejecutarAccion(accion: AccionKiosquero): void {
    this.router.navigateByUrl(accion.ruta);
  }
}
