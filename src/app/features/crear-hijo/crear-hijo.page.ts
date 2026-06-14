import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CrearHijoPresenter } from './presenter/crear-hijo.presenter';

type CrearHijoForm = FormGroup<{
  nombre: FormControl<string>;
  apellido: FormControl<string>;
  username: FormControl<string>;
  email: FormControl<string>;
  dni: FormControl<string>;
  colegioId: FormControl<string>;
  gradoId: FormControl<string>;
}>;

function usernameSinFormatoEmail(
  control: AbstractControl,
): ValidationErrors | null {
  const valor = typeof control.value === 'string' ? control.value.trim() : '';
  if (!valor) return null;
  return /@/.test(valor) ? { emailFormat: true } : null;
}

@Component({
  selector: 'app-crear-hijo-page',
  templateUrl: './crear-hijo.page.html',
  styleUrl: './crear-hijo.page.css',
  imports: [NavbarComponent, ReactiveFormsModule],
  providers: [CrearHijoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearHijoPage implements OnInit {
  protected readonly presenter = inject(CrearHijoPresenter);
  private readonly alumnosService = inject(AlumnosService);
  private readonly perfilService = inject(PerfilService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form: CrearHijoForm = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    apellido: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    username: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(50),
        usernameSinFormatoEmail,
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    dni: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d{7,9}$/),
      ],
    }),
    colegioId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    gradoId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly nombreUsuario =
    this.perfilService.getPerfil()?.nombre ??
    this.usuarioService.getUsuarioActual().nombre;

  constructor() {
    this.usuarioService.setHomeUrl('/tutor');
    this.usuarioService.setNombreNavbar(this.nombreUsuario);
  }

  ngOnInit(): void {
    void this.alumnosService.asegurarCargados();
    void this.presenter.cargarColegios();

    this.form.controls.colegioId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((colegioId) => {
        this.form.controls.gradoId.setValue('');
        void this.presenter.cargarGrados(colegioId);
      });
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.form.invalid || this.presenter.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, apellido, username, email, dni, gradoId } =
      this.form.getRawValue();
    await this.presenter.crear({
      nombre,
      apellido,
      username,
      email,
      dni,
      gradoId,
    });
  }

  protected onCancelar(): void {
    if (this.alumnosService.alumnos().length > 0) {
      void this.router.navigateByUrl('/tutor');
    }
  }

  protected tieneHijos(): boolean {
    return this.alumnosService.alumnos().length > 0;
  }
}
