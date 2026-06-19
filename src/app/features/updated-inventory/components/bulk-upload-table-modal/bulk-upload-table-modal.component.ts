import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, FormControl } from '@angular/forms';
import { BulkProductResponse } from '../../services/bulk-upload.service';

import { Category } from '../../models/category.interface';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-bulk-upload-table-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './bulk-upload-table-modal.component.html',
  styleUrl: './bulk-upload-table-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkUploadTableModalComponent implements OnChanges {
  @Input() isProcessingFile = false;
  @Input() prefilledProducts: BulkProductResponse[] = [];
  @Input() categories: Category[] = [];
  @Output() fileSelected = new EventEmitter<File>();
  @Output() saveProducts = new EventEmitter<BulkProductResponse[]>();
  @Output() closeModal = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  readonly form: FormGroup = this.fb.group({
    products: this.fb.array([]),
  });

  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  asFormControl(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prefilledProducts'] && this.prefilledProducts) {
      this.rebuildFormArray();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileSelected.emit(input.files[0]);
    }
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSave(): void {
    if (this.form.valid && this.productsArray.length > 0) {
      const productsToSave = this.form.value.products.map((p: Record<string, unknown>) => {
        const payload = { ...p };
        delete payload['unidadMedida'];
        return payload as unknown as BulkProductResponse;
      });
      this.saveProducts.emit(productsToSave);
    } else {
      this.form.markAllAsTouched();
      if (this.productsArray.length === 0) {
        this.toastService.mostrar('No hay productos para guardar', 'error');
      } else {
        this.toastService.mostrar('¡Atención! Hay productos sin categoría asignada. Revise las filas marcadas en rojo.', 'error');
      }
    }
  }

  addProductRow(product?: BulkProductResponse): void {
    const catIdInicial = product?.categoriaId ?? null;
    const unidadInicial = this.obtenerUnidadesPorCategoria(catIdInicial)[0];

    const row = this.fb.group({
      nombre: [product?.nombre ?? '', [Validators.required]],
      descripcion: [product?.descripcion ?? ''],
      precio: [product?.precio ?? 0, [Validators.required, Validators.min(0)]],
      peso: [product?.peso ?? 0, [Validators.min(0)]],
      unidadMedida: [unidadInicial],
      stockActual: [product?.stockActual ?? 0, [Validators.min(0)]],
      requierePreparacion: [product?.requierePreparacion ?? false],
      categoriaId: [product?.categoriaId ?? '', [Validators.required]],
      nuevaCategoriaNombre: [product?.nuevaCategoriaNombre ?? ''],
      saludEtiquetasIds: [product?.saludEtiquetasIds ?? []],
      tipoEtiquetasIds: [product?.tipoEtiquetasIds ?? []],
    });

    // Validar nuevaCategoriaNombre si categoriaId es 'NEW'
    row.get('categoriaId')?.valueChanges.subscribe(value => {
      const nuevaCatCtrl = row.get('nuevaCategoriaNombre');
      if (value === 'NEW') {
        nuevaCatCtrl?.setValidators([Validators.required]);
      } else {
        nuevaCatCtrl?.clearValidators();
      }
      nuevaCatCtrl?.updateValueAndValidity();

      const unidadesValidas = this.obtenerUnidadesPorCategoria(value);
      const unidadCtrl = row.get('unidadMedida');
      const currentValue = unidadCtrl?.value as string | null;
      if (unidadCtrl && (!currentValue || !unidadesValidas.includes(currentValue))) {
        unidadCtrl.setValue(unidadesValidas[0], { emitEvent: false });
      }
    });

    this.productsArray.push(row);
  }

  removeProductRow(index: number): void {
    this.productsArray.removeAt(index);
  }

  private rebuildFormArray(): void {
    this.productsArray.clear();
    for (const product of this.prefilledProducts) {
      this.addProductRow(product);
    }
  }

  obtenerUnidadesPorCategoria(categoriaId: string | null): string[] {
    if (!categoriaId) return ['g', 'kg'];
    const categoria = this.categories.find(c => c.id === categoriaId);
    if (!categoria) return ['g', 'kg'];

    const desc = categoria.descripcion.toLowerCase();
    const esBebida = desc.includes('bebida') || desc.includes('jugo') || desc.includes('agua') || desc.includes('gaseosa') || desc.includes('liquido');
    
    return esBebida ? ['ml', 'l'] : ['g', 'kg'];
  }
}
