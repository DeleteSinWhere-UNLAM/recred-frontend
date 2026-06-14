import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PromocionCreada } from '../../models/recomendacion.model';
import { Product } from '../../../updated-inventory/models/product.interface';

@Component({
  selector: 'app-ia-promotion-approval-modal',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './ia-promotion-approval-modal.component.html',
  styleUrls: ['./ia-promotion-approval-modal.component.css']
})
export class IaPromotionApprovalModalComponent {
  @Input({ required: true }) promotion!: PromocionCreada;
  @Input({ required: true }) resolvedProducts: Product[] = [];

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
