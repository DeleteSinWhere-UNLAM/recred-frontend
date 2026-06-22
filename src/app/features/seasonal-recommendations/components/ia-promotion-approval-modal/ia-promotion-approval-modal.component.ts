import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PromocionSugerida } from '../../models/recomendacion.model';
import { Product } from '../../../updated-inventory/models/product.interface';

@Component({
  selector: 'app-ia-promotion-approval-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ia-promotion-approval-modal.component.html',
  styleUrls: ['./ia-promotion-approval-modal.component.css']
})
export class IaPromotionApprovalModalComponent implements OnInit {
  @Input({ required: true }) suggestedPromotion!: PromocionSugerida;
  @Input({ required: true }) resolvedProducts: Product[] = [];

  @Output() confirmPromotion = new EventEmitter<{ discountPercentage: number, startDate: string, endDate: string, productIds: string[] }>();
  @Output() closeModal = new EventEmitter<void>();

  promotionForm!: FormGroup;
  selectedProductIds: Set<string> = new Set<string>();
  private readonly formBuilder = inject(FormBuilder);

  ngOnInit(): void {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const format = (d: Date) => d.toISOString().split('T')[0];

    this.promotionForm = this.formBuilder.group({
      discountPercentage: [this.suggestedPromotion?.descuento || 10, [Validators.required, Validators.min(1), Validators.max(100)]],
      startDate: [format(today), Validators.required],
      endDate: [format(nextWeek), Validators.required]
    });

    // Auto-select the products that are in suggestedPromotion target
    if (this.suggestedPromotion?.productIds) {
      this.suggestedPromotion.productIds.forEach(id => this.selectedProductIds.add(id));
    } else {
      this.resolvedProducts.forEach(p => this.selectedProductIds.add(p.id));
    }
  }

  toggleProductSelection(productId: string): void {
    if (this.isProductSelected(productId)) {
      this.selectedProductIds.delete(productId);
    } else {
      this.selectedProductIds.add(productId);
    }
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds.has(productId);
  }

  getDiscountedPrice(originalPrice: number): number {
    const discount = this.promotionForm.get('discountPercentage')?.value || 0;
    return originalPrice * (1 - discount / 100);
  }

  onConfirm(): void {
    if (this.promotionForm.valid && this.selectedProductIds.size > 0) {
      this.confirmPromotion.emit({
        discountPercentage: this.promotionForm.get('discountPercentage')?.value,
        startDate: this.promotionForm.get('startDate')?.value,
        endDate: this.promotionForm.get('endDate')?.value,
        productIds: Array.from(this.selectedProductIds)
      });
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
