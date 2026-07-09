import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PromocionesPagePresenter, PromotionWithProducts } from './presenter/promociones.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { EditarPromocionModalComponent } from './components/editar-promocion-modal/editar-promocion-modal.component';

@Component({
  selector: 'app-promociones-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, EditarPromocionModalComponent],
  providers: [PromocionesPagePresenter],
  templateUrl: './promociones.page.html',
  styleUrls: ['./promociones.page.css']
})
export class PromocionesPageComponent implements OnInit {
  public readonly presenter = inject(PromocionesPagePresenter);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  isModalOpen = false;
  isTypeModalOpen = false;
  selectedPromotion: PromotionWithProducts | null = null;

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
  }

  ngOnInit() {
    this.presenter.loadPromotions();
  }

  openEditModal(promo: PromotionWithProducts) {
    this.selectedPromotion = promo;
    this.isModalOpen = true;
  }

  openTypeModal() {
    this.isTypeModalOpen = true;
  }

  closeTypeModal() {
    this.isTypeModalOpen = false;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.closeTypeModal();
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedPromotion = null;
  }

  savePromotion(promoData: Partial<PromotionWithProducts>) {
    this.presenter.savePromotion(promoData);
    this.closeModal();
  }
}
