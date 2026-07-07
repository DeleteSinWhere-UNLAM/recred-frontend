import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { RECREO_LABELS } from '../../models/orden-compra.model';
import { CarritoService } from '../../services/carrito.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CompraService } from '../../services/compra.service';
import { SugerenciasService } from '../../../sugerencias/services/sugerencias.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';

@Injectable()
export class ConfirmarPresenter {
  private readonly compraService = inject(CompraService);
  private readonly carritoService = inject(CarritoService);
  private readonly sugerenciasService = inject(SugerenciasService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly perfilService = inject(PerfilService);

  private readonly cargandoState = signal<boolean>(false);

  readonly cargando = this.cargandoState.asReadonly();
  readonly orden = this.compraService.ordenEnCurso;

  readonly ordenes = computed(() => this.orden()?.ordenes ?? []);
  readonly total = computed(() => this.orden()?.total ?? 0);
  readonly vacia = computed(() => this.ordenes().length === 0);

  readonly advertenciaSaldo = computed<string | null>(() => {
    const sinSaldo = this.ordenes().filter(
      (o) => o.alumno.saldo < o.subtotal,
    );
    if (sinSaldo.length === 0) return null;
    const nombres = sinSaldo.map((o) => o.alumno.nombre).join(', ');
    return `Saldo insuficiente para: ${nombres}. Se descontará el remanente del próximo recarga.`;
  });

  recreoLabel(recreo: keyof typeof RECREO_LABELS): string {
    return RECREO_LABELS[recreo];
  }

  confirmar(): void {
    if (this.cargandoState() || this.vacia()) return;
    const ordenActual = this.orden();
    if (ordenActual?.sugerenciaId && !this.tienePlanAvanzado()) {
      this.toastService.mostrar('Comprar sugerencias IA esta disponible con plan Avanzado.', 'info');
      if (this.perfilService.rol() === 'PADRE') {
        this.router.navigateByUrl('/suscripcion');
      }
      return;
    }

    this.cargandoState.set(true);
    const obs$ = (ordenActual?.sugerenciaId)
      ? this.sugerenciasService.comprarSugerencia(ordenActual.sugerenciaId).pipe(
          switchMap(() => this.compraService.procesarPago())
        )
      : this.compraService.procesarPago();

    obs$.subscribe({
      next: (orden) => {
        for (const o of orden.ordenes) {
          this.carritoService.limpiarAlumno(o.alumno.id);
        }
        this.cargandoState.set(false);
        this.router.navigateByUrl('/compra/exito');
      },
      error: () => {
        this.cargandoState.set(false);
        this.toastService.mostrar('No pudimos procesar el pago. Intentalo de nuevo.', 'error');
      },
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return fecha;
  }

  cancelar(): void {
    this.compraService.cancelarOrden();
    this.router.navigateByUrl('/compra');
  }

  private tienePlanAvanzado(): boolean {
    return this.perfilService.perfil()?.plan?.toUpperCase() === 'AVANZADO';
  }
}
