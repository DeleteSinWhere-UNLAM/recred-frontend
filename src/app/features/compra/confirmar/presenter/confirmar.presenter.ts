import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { RECREO_LABELS } from '../../models/orden-compra.model';
import { CarritoService } from '../../services/carrito.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CompraService } from '../../services/compra.service';
import { SugerenciasService } from '../../../sugerencias/services/sugerencias.service';

@Injectable()
export class ConfirmarPresenter {
  private readonly compraService = inject(CompraService);
  private readonly carritoService = inject(CarritoService);
  private readonly sugerenciasService = inject(SugerenciasService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

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
    this.cargandoState.set(true);

    const ordenActual = this.orden();
    const obs$ = (ordenActual?.sugerenciaId)
      ? this.sugerenciasService.comprarSugerencia(ordenActual.sugerenciaId).pipe(
          switchMap(() => this.compraService.simularPago())
        )
      : this.compraService.simularPago();

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

  cancelar(): void {
    this.compraService.cancelarOrden();
    this.router.navigateByUrl('/compra');
  }
}
