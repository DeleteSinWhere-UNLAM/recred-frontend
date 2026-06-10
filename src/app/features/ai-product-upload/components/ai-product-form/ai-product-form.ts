import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AiProductResponse } from '../../models/ai-product-response.interface';
import { SaveProductRequest } from '../../models/save-product-request.interface';
import { Category } from '../../../updated-inventory/models/category.interface';

@Component({
  selector: 'app-ai-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ai-product-form.html',
  styleUrl: './ai-product-form.css',
})
export class AiProductForm implements OnInit, OnChanges {
  @Input() prefillData: AiProductResponse | null = null;
  @Input() categories: Category[] = [];
  @Input() isSaving = false;
  @Input() buffetId = '';
  @Output() save = new EventEmitter<SaveProductRequest>();

  private fb = inject(FormBuilder);
  productForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    peso: [0, [Validators.required, Validators.min(0.001)]],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    categoriaId: [null, Validators.required],
    nuevaCategoriaNombre: [''],
    requierePreparacion: [false],
    contiene_azucar: [false],
    contiene_mani: [false],
    contiene_lactosa: [false],
    contiene_tacc: [false],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['prefillData'] && this.prefillData) {
      this.productForm.patchValue({
        nombre: this.prefillData.nombre,
        descripcion: this.prefillData.descripcion,
        peso: this.parseWeight(this.prefillData.peso),
        contiene_azucar: this.prefillData.contiene_azucar,
        contiene_mani: this.prefillData.contiene_mani,
        contiene_lactosa: this.prefillData.contiene_lactosa,
        contiene_tacc: this.prefillData.contiene_tacc,
      });
    }
  }

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

  hasError(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.productForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;

    return 'Valor inválido';
  }

  submitForm() {
    if (this.productForm.valid && this.buffetId) {
      const formValue = this.productForm.value;
      const request: SaveProductRequest = {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        precio: formValue.precio,
        peso: formValue.peso,
        requierePreparacion: formValue.requierePreparacion,
        categoriaId: formValue.categoriaId === 'NEW' ? null : formValue.categoriaId,
        nuevaCategoriaNombre: formValue.categoriaId === 'NEW' ? formValue.nuevaCategoriaNombre : '',
        buffetId: this.buffetId,
        stockActual: formValue.stockActual,
        clasificacionesSaludIds: this.buildHealthClassificationIds(formValue),
        tiposIds: [],
      };
      this.save.emit(request);
    } else {
      this.productForm.markAllAsTouched();
    }
  }

  private parseWeight(peso: string): number {
    const cleaned = peso.replace(/[^0-9.,]/g, '').replace(',', '.');
    const value = parseFloat(cleaned);
    if (isNaN(value)) return 0;

    const lower = peso.toLowerCase();
    if (lower.includes('kg') || lower.includes('l')) {
      return value;
    }
    return value / 1000;
  }

  private buildHealthClassificationIds(formValue: Record<string, boolean>): string[] {
    const ids: string[] = [];
    // Si el producto NO contiene TACC → etiqueta "Sin TACC" (apto para celíacos)
    if (!formValue['contiene_tacc']) ids.push('15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8');
    // Si el producto NO contiene azúcar → etiqueta "Sin Azúcar"
    if (!formValue['contiene_azucar']) ids.push('7e113952-93ca-4797-a80d-54f3a31b2165');
    // Si el producto SÍ contiene lácteos → etiqueta "Contiene Lácteos"
    if (formValue['contiene_lactosa']) ids.push('a087290b-474e-4a8c-9e5d-ce1c375d4009');
    return ids;
  }
}
