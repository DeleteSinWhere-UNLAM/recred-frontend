import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AiProductResponse } from '../../models/ai-product-response.interface';

@Component({
  selector: 'app-ai-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ai-product-form.html',
  styleUrl: './ai-product-form.css',
})
export class AiProductForm implements OnChanges {
  @Input() prefillData: AiProductResponse | null = null;
  @Output() save = new EventEmitter<AiProductResponse>();

  private fb = inject(FormBuilder);
  productForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    marca: ['', Validators.required],
    categoria: ['', Validators.required]
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['prefillData'] && this.prefillData) {
      this.productForm.patchValue(this.prefillData);
    }
  }

  submitForm() {
    if (this.productForm.valid) {
      this.save.emit(this.productForm.value as AiProductResponse);
    }
  }
}
