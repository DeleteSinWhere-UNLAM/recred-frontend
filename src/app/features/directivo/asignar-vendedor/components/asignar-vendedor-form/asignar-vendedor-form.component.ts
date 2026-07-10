import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CrearVendedorRequest } from '../../../models/directivo.model';

@Component({
  selector: 'app-asignar-vendedor-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './asignar-vendedor-form.component.html',
  styleUrl: './asignar-vendedor-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsignarVendedorFormComponent {
  private readonly fb = inject(FormBuilder);

  @Input() loading = false;
  @Input() error: string | null = null;
  
  @Output() submitForm = new EventEmitter<CrearVendedorRequest>();
  @Output() cancelForm = new EventEmitter<void>();

  form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dni: ['', Validators.required],
    phone: ['', Validators.required],
    cuit: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]]
  });

  normalizarCuit(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cuit = input.value.replace(/\D/g, '').slice(0, 11);

    if (input.value !== cuit) {
      input.value = cuit;
    }

    if (this.form.controls.cuit.value !== cuit) {
      this.form.controls.cuit.setValue(cuit, { emitEvent: false });
    }

    this.form.controls.cuit.markAsDirty();
  }

  onSubmit() {
    if (this.form.valid && !this.loading) {
      const v = this.form.value;
      this.submitForm.emit({
        username: v.username!,
        email: v.email!,
        firstName: v.firstName!,
        lastName: v.lastName!,
        dni: v.dni!,
        phone: v.phone!,
        cuit: v.cuit!
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
