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
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BulkProductResponse } from '../../services/bulk-upload.service';

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
  @Output() fileSelected = new EventEmitter<File>();
  @Output() saveProducts = new EventEmitter<BulkProductResponse[]>();
  @Output() closeModal = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  readonly form: FormGroup = this.fb.group({
    products: this.fb.array([]),
  });

  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
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
      this.saveProducts.emit(this.form.value.products);
    } else {
      this.form.markAllAsTouched();
    }
  }

  addProductRow(product?: BulkProductResponse): void {
    const row = this.fb.group({
      nombre: [product?.nombre ?? '', [Validators.required]],
      descripcion: [product?.descripcion ?? ''],
      precio: [product?.precio ?? 0, [Validators.required, Validators.min(0)]],
      peso: [product?.peso ?? 0, [Validators.min(0)]],
      stockActual: [product?.stockActual ?? 0, [Validators.min(0)]],
      requierePreparacion: [product?.requierePreparacion ?? false],
      categoriaId: [product?.categoriaId ?? null],
      nuevaCategoriaNombre: [product?.nuevaCategoriaNombre ?? ''],
      saludEtiquetasIds: [product?.saludEtiquetasIds ?? []],
      tipoEtiquetasIds: [product?.tipoEtiquetasIds ?? []],
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
}
