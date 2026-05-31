import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../models/product.interface';
import { Category } from '../../models/category.interface';

export interface ProductFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  peso: number;
  stockActual: number;
  categoriaId: string | null;
  nuevaCategoriaNombre: string;
  requierePreparacion: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit, OnChanges {
  @Input() product: Product | null = null;
  @Input() categories: Category[] = [];
  @Input() isSaving = false;
  @Output() formSubmit = new EventEmitter<ProductFormData>();
  @Output() formCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  productForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['', [Validators.required, Validators.minLength(3)]],
    precio: [null, [Validators.required, Validators.min(0.01)]],
    peso: [null, [Validators.required, Validators.min(0.001)]],
    stockActual: [null, [Validators.required, Validators.min(0)]],
    categoriaId: [null, Validators.required],
    nuevaCategoriaNombre: [''],
    requierePreparacion: [false],
  });

  ngOnInit(): void {
    this.productForm.get('categoriaId')?.valueChanges.subscribe(value => {
      const nuevaCategoriaCtrl = this.productForm.get('nuevaCategoriaNombre');
      if (value === 'NEW') {
        nuevaCategoriaCtrl?.setValidators([Validators.required]);
      } else {
        nuevaCategoriaCtrl?.clearValidators();
        nuevaCategoriaCtrl?.setValue('');
      }
      nuevaCategoriaCtrl?.updateValueAndValidity();
    });
  }

  get isEditing(): boolean {
    return this.product !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.productForm.patchValue({
        nombre: this.product.nombre,
        descripcion: this.product.descripcion,
        precio: this.product.precio,
        peso: this.product.peso,
        stockActual: this.product.stockActual,
        categoriaId: this.product.categoriaId || 'NEW',
        nuevaCategoriaNombre: this.product.categoriaId ? '' : (this.product.categoriaNombre || ''),
        requierePreparacion: this.product.requierePreparacion,
      });
    }

    if (changes['product'] && !this.product) {
      this.productForm.reset({ requierePreparacion: false });
    }
  }

  submitForm(): void {
    if (this.productForm.valid) {
      this.formSubmit.emit(this.productForm.value);
    } else {
      this.productForm.markAllAsTouched();
    }
  }

  hasError(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.productForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;

    return 'Valor inválido';
  }
}
