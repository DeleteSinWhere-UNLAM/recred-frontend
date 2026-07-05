import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CrearBuffetRequest } from '../../../models/directivo.model';

@Component({
  selector: 'app-crear-buffet-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './crear-buffet-form.component.html',
  styleUrl: './crear-buffet-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearBuffetFormComponent {
  private readonly fb = inject(FormBuilder);

  @Input() loading = false;
  @Input() error: string | null = null;
  
  @Output() submitForm = new EventEmitter<CrearBuffetRequest>();
  @Output() cancelForm = new EventEmitter<void>();

  form = this.fb.group({
    buffetName: ['', Validators.required],
    expirationDate: ['', Validators.required]
  });

  onSubmit() {
    if (this.form.valid && !this.loading) {
      const v = this.form.value;
      this.submitForm.emit({
        name: v.buffetName!,
        habilitationExpirationDate: v.expirationDate!
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
