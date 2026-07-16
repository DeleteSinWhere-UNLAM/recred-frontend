import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { SuggestedProduct } from '../../models/sugerencia-producto.model';

export interface PromotionFormData {
  discountPercentage: number;
  startDate: string;
  endDate: string;
  productIds: string[];
  imageUrl?: string;
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
  private readonly http = inject(HttpClient);

  isUploadingImage = false;
  imagePreview: string | null = null;

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result as string;
      reader.readAsDataURL(file);

      this.uploadImage(file);
    }
  }

  private uploadImage(file: File): void {
    this.isUploadingImage = true;
    const formData = new FormData();
    formData.append("image", file);
    this.http.post<{ url_imagen: string }>(`${environment.apiUrl}/load-stock/upload-image`, formData)
      .subscribe({
        next: (res) => {
          this.imagePreview = res.url_imagen;
          this.isUploadingImage = false;
        },
        error: () => {
          this.isUploadingImage = false;
        }
      });
  }

  removeImage(): void {
    this.imagePreview = null;
  }

  onConfirm(): void {
    if (this.isPromotionFormValid() && this.hasSelectedComboProducts()) {
      const formData: PromotionFormData = {
        discountPercentage: this.promotionForm.get('discountPercentage')?.value,
        startDate: this.promotionForm.get('startDate')?.value,
        endDate: this.promotionForm.get('endDate')?.value,
        productIds: Array.from(this.selectedProductIds),
        imageUrl: this.imagePreview || undefined
      };
      this.confirmPromotion.emit(formData);
    }
  }

  onClose(): void {
    this.closeModal.emit();
    this.imagePreview = null;
    this.isUploadingImage = false;
  }

  private isPromotionFormValid(): boolean {
    return this.promotionForm.valid;
  }

  private hasSelectedComboProducts(): boolean {
    return this.selectedProductIds.size > 0;
  }
}
