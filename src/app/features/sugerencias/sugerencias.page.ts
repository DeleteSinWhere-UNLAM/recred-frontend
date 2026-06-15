import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { SugerenciasService } from '../../features/sugerencias/services/sugerencias.service';
import {
  EstadisticasVenta,
  SugerenciaProducto,
} from '../../features/sugerencias/models/sugerencia-producto.model';
@Component({
  selector: 'app-sugerencias-page',
  standalone: true,
  templateUrl: './sugerencias.page.html',
  styleUrl: './sugerencias.page.css',
  imports: [NavbarComponent],
})
export class SugerenciasPage {
  private readonly usuarioService = inject(UsuarioService);
  private readonly sugerenciasService = inject(SugerenciasService);
  private readonly router = inject(Router);
  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;
  readonly usuarioId = this.usuarioService.getUsuarioActual().id;
  sugerencias: SugerenciaProducto[] = [];
  sugerenciaSeleccionada?: SugerenciaProducto;
  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
    const perfilRaw = localStorage.getItem('recred.perfil');
    const usuarioId = perfilRaw ? JSON.parse(perfilRaw).id : null;
    if (usuarioId) {
      this.sugerenciasService.getSugerencias(usuarioId).subscribe((data) => {
        this.sugerencias = data;
        if (data.length > 0) {
          this.sugerenciaSeleccionada = data[0];
        }
        console.log('SUGERENCIAS:', data);
      });
    }
  }
  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }
  seleccionarProducto(sugerencia: SugerenciaProducto): void {
    this.sugerenciaSeleccionada = sugerencia;
  }
  get totalProductosAnalizados(): number {
    return this.sugerencias.length;
  }
  get totalStockInmovilizado(): number {
    return this.sugerencias.reduce(
      (total, sugerencia) =>
        total + (sugerencia.estadisticasVenta.stockActual ?? 0),
      0,
    );
  }
  get promedioDiasSinVenta(): number {
    if (!this.sugerencias.length) {
      return 0;
    }
    const totalDias = this.sugerencias.reduce(
      (total, sugerencia) =>
        total + (sugerencia.estadisticasVenta.diasSinVenta ?? 0),
      0,
    );
    return Math.round(totalDias / this.sugerencias.length);
  }
  get productoMasCritico(): SugerenciaProducto | undefined {
    return [...this.sugerencias].sort(
      (a, b) =>
        b.estadisticasVenta.diasSinVenta - a.estadisticasVenta.diasSinVenta,
    )[0];
  }
  get estadisticasSeleccionadas(): EstadisticasVenta | undefined {
    return this.sugerenciaSeleccionada?.estadisticasVenta;
  }
}
