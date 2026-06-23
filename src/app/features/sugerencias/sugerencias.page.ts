import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { SugerenciaProducto } from '../../features/sugerencias/models/sugerencia-producto.model';
import { SugerenciasPresenter } from './presenter/sugerencias.presenter';
import { ComboPromotionModalComponent } from './components/combo-promotion-modal/combo-promotion-modal.component';

@Component({
  selector: 'app-sugerencias-page',
  standalone: true,
  templateUrl: './sugerencias.page.html',
  styleUrl: './sugerencias.page.css',
  imports: [CommonModule, ComboPromotionModalComponent],
  providers: [SugerenciasPresenter]
})
export class SugerenciasPage implements OnInit {
  readonly presenter = inject(SugerenciasPresenter);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;
  readonly Math = Math;

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
  }

  ngOnInit(): void {
    const perfilRaw = localStorage.getItem('recred.perfil');
    const usuarioId = perfilRaw ? JSON.parse(perfilRaw).id : null;
    if (this.hasUsuarioId(usuarioId)) {
      this.presenter.initialize(usuarioId);
    }
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  onGenerarPromocion(): void {
    this.presenter.openComboPromotionModal();
  }

  onConfirmPromotion(promotionData: { discountPercentage: number, startDate: string, endDate: string, productIds: string[] }): void {
    this.presenter.generatePromotion(promotionData);
  }

  onCloseModal(): void {
    this.presenter.closeComboPromotionModal();
  }

  private hasUsuarioId(usuarioId: string | null): boolean {
    return usuarioId !== null && usuarioId !== undefined;
  }

  seleccionarProducto(sugerencia: SugerenciaProducto): void {
    this.presenter.seleccionarProducto(sugerencia);
  }
}
