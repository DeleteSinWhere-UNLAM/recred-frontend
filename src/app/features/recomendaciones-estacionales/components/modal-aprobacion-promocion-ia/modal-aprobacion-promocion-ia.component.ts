import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PromocionCreada } from '../../models/recomendacion.model';
import { Producto } from '../../../inventario/models/producto.model';

@Component({
  selector: 'app-modal-aprobacion-promocion-ia',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './modal-aprobacion-promocion-ia.component.html',
  styleUrls: ['./modal-aprobacion-promocion-ia.component.css']
})
export class ModalAprobacionPromocionIaComponent {
  @Input({ required: true }) promotion!: PromocionCreada;
  @Input({ required: true }) resolvedProducts: Producto[] = [];

  @Output() approve = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() discard = new EventEmitter<string>();
  @Output() closeModal = new EventEmitter<void>();

  getDiscountedPrice(originalPrice: number): number {
    if (!this.promotion || !this.promotion.discountPercentage) return originalPrice;
    return originalPrice * (1 - this.promotion.discountPercentage / 100);
  }

  onApprove(): void {
    this.approve.emit(this.promotion.id);
  }

  onEdit(): void {
    this.edit.emit(this.promotion.id);
  }

  onDiscard(): void {
    this.discard.emit(this.promotion.id);
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
