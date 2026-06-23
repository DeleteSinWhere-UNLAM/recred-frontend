import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SuggestedProduct } from '../../models/sugerencia-producto.model';

export interface PromotionFormData {
  discountPercentage: number;
  startDate: string;
  endDate: string;
  productIds: string[];
}

@Component({
  selector: 'app-combo-promotion-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './combo-promotion-modal.component.html',
  styleUrls: ['./combo-promotion-modal.component.css']
})
export class ComboPromotionModalComponent {
  @Input({ required: true }) baseProductName!: string;
  @Input({ required: true }) suggestedProducts: SuggestedProduct[] = [];
  
  @Output() confirmPromotion = new EventEmitter<PromotionFormData>();
  @Output() closeModal = new EventEmitter<void>();

  promotionForm: FormGroup;
  selectedProductIds: Set<string> = new Set<string>();
  private readonly formBuilder = inject(FormBuilder);

  constructor() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const format = (d: Date) => d.toISOString().split('T')[0];

    this.promotionForm = this.formBuilder.group({
      discountPercentage: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      startDate: [format(today), Validators.required],
      endDate: [format(nextWeek), Validators.required]
    });
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
    if (this.isPromotionFormValid() && this.hasSelectedComboProducts()) {
      const formData: PromotionFormData = {
        discountPercentage: this.promotionForm.get('discountPercentage')?.value,
        startDate: this.promotionForm.get('startDate')?.value,
        endDate: this.promotionForm.get('endDate')?.value,
        productIds: Array.from(this.selectedProductIds)
      };
      this.confirmPromotion.emit(formData);
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  private isPromotionFormValid(): boolean {
    return this.promotionForm.valid;
  }

  private hasSelectedComboProducts(): boolean {
    return this.selectedProductIds.size > 0;
  }
}
