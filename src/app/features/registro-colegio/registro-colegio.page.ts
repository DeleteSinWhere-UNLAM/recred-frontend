import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistroColegioPresenter } from './presenter/registro-colegio.presenter';
import { SchoolRegistrationPayload } from './models/registro-colegio.model';

@Component({
  selector: 'app-registro-colegio-page',
  standalone: true,
  templateUrl: './registro-colegio.page.html',
  styleUrl: './registro-colegio.page.css',
  imports: [AsyncPipe, ReactiveFormsModule],
  providers: [RegistroColegioPresenter],
  host: { style: 'display: block; min-height: 100vh; background: #0a0f1a;' },
})
export class RegistroColegioPage implements OnInit {
  readonly presenter = inject(RegistroColegioPresenter);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  form!: FormGroup;

  ngOnInit(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{8,15}$/;

    this.form = this.fb.group({
      schoolName: ['', Validators.required],
      schoolEmail: ['', [Validators.required, Validators.pattern(emailRegex)]],
      schoolPhone: ['', [Validators.required, Validators.pattern(phoneRegex)]],
      schoolCue: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],

      directorFirstName: ['', Validators.required],
      directorLastName: ['', Validators.required],
      directorEmail: ['', [Validators.required, Validators.pattern(emailRegex)]],
      directorPhone: ['', [Validators.required, Validators.pattern(phoneRegex)]],
      directorDni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
      directorUsername: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.-]+$/), Validators.maxLength(20)]],
    });

    this.presenter.error$.subscribe((err) => {
      if (err?.campo && this.form.get(err.campo)) {
        this.form.get(err.campo)?.setErrors({ serverError: err.mensaje });
      }
    });
  }

  onInputNumeros(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const cleanValue = input.value.replace(/\D/g, '');
    if (input.value !== cleanValue) {
      this.form.get(controlName)?.setValue(cleanValue, { emitEvent: false });
      input.value = cleanValue;
    }
  }

  onInputEmail(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const cleanValue = input.value.toLowerCase().replace(/\s/g, '');
    if (input.value !== cleanValue) {
      this.form.get(controlName)?.setValue(cleanValue, { emitEvent: false });
      input.value = cleanValue;
    }
  }

  onInputUsername(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const cleanValue = input.value.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (input.value !== cleanValue) {
      this.form.get(controlName)?.setValue(cleanValue, { emitEvent: false });
      input.value = cleanValue;
    }
  }

  enviar(): void {
    if (this.form.invalid) return;

    const v = this.form.value;
    const payload: SchoolRegistrationPayload = {
      schoolName: v.schoolName,
      schoolEmail: v.schoolEmail,
      schoolPhone: v.schoolPhone,
      schoolCue: v.schoolCue,

      directorFirstName: v.directorFirstName,
      directorLastName: v.directorLastName,
      directorEmail: v.directorEmail,
      directorPhone: v.directorPhone,
      directorDni: v.directorDni,
      directorUsername: v.directorUsername,
    };

    this.presenter.enviarSolicitud(payload);
  }

  volver(): void {
    void this.router.navigateByUrl('/');
  }
}
