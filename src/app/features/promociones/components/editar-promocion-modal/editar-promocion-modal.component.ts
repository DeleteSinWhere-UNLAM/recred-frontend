import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionWithProducts } from '../../presenter/promociones.presenter';

@Component({
  selector: 'app-editar-promocion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-promocion-modal.component.html',
  styleUrl: './editar-promocion-modal.component.css'
})
export class EditarPromocionModalComponent implements OnInit, OnChanges {
  @Input() promotion!: PromotionWithProducts;
  @Input() isOpen = false;
  
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<PromotionWithProducts>>();

  formData = {
    name: '',
    discountPercentage: 0,
    startDate: '',
    endDate: ''
  };

  ngOnInit(): void {
    this.resetForm();
  }

  ngOnChanges(): void {
    if (this.isOpen && this.promotion) {
      this.resetForm();
    }
  }

  resetForm(): void {
    if (this.promotion) {
      this.formData = {
        name: this.promotion.name,
        discountPercentage: this.promotion.discountPercentage,
        startDate: this.formatDateForInput(this.promotion.startDate),
        endDate: this.formatDateForInput(this.promotion.endDate)
      };
    }
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10);
  }

  formatDateForServer(dateString: string, isEnd = false): string {
    if (!dateString) return '';
    return new Date(dateString + (isEnd ? 'T23:59:59' : 'T00:00:00')).toISOString();
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  saveChanges(): void {
    if (this.formData.name && this.formData.startDate && this.formData.endDate) {
      this.save.emit({
        id: this.promotion.id,
        name: this.formData.name,
        discountPercentage: this.formData.discountPercentage,
        startDate: this.formatDateForServer(this.formData.startDate, false),
        endDate: this.formatDateForServer(this.formData.endDate, true),
        productIds: this.promotion.productIds
      });
    }
  }
}
