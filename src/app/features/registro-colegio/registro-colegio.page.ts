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
    this.form = this.fb.group({
      schoolName: ['', Validators.required],
      schoolEmail: ['', [Validators.required, Validators.email]],
      schoolPhone: ['', Validators.required],
      schoolCue: ['', Validators.required],

      directorFirstName: ['', Validators.required],
      directorLastName: ['', Validators.required],
      directorEmail: ['', [Validators.required, Validators.email]],
      directorPhone: ['', Validators.required],
      directorDni: ['', Validators.required],
      directorUsername: ['', Validators.required],
    });
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
