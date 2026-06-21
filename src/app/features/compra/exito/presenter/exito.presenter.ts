import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { CompraService } from '../../services/compra.service';

@Injectable()
export class ExitoPresenter {
  private readonly compraService = inject(CompraService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  readonly orden = this.compraService.ultimaOrden;

  readonly ordenes = computed(() => this.orden()?.ordenes ?? []);
  readonly codigos = computed(() => this.orden()?.codigos ?? {});
  readonly total = computed(() => this.orden()?.total ?? 0);
  readonly vacia = computed(() => this.ordenes().length === 0);

  codigoDe(alumnoId: string): string {
    return this.codigos()[alumnoId] ?? '----';
  }

  volverInicio(): void {
    this.router.navigateByUrl(this.usuarioService.homeUrl());
  }

  verPendientes(): void {
    this.router.navigate(['/movimientos'], {
      queryParams: { estado: 'PENDIENTE,EN_PREPARACION' },
    });
  }
}
