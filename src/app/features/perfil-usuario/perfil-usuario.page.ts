import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ActualizarPerfilUsuarioRequest,
  PerfilUsuario,
  UsuarioLogueado,
} from '../../data-access/models/perfil-usuario.model';
import { PerfilUsuarioService } from '../../data-access/services/perfil-usuario.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';

type PerfilUsuarioForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  phone: FormControl<string>;
  documentNumber: FormControl<string>;
}>;

@Component({
  selector: 'app-perfil-usuario-page',
  templateUrl: './perfil-usuario.page.html',
  styleUrl: './perfil-usuario.page.css',
  imports: [NavbarComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilUsuarioPage implements OnInit {
  private readonly perfilUsuarioService = inject(PerfilUsuarioService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly usuario = signal<UsuarioLogueado | null>(null);
  protected readonly perfil = signal<PerfilUsuario | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly subiendoFoto = signal(false);
  protected readonly error = signal<string | null>(null);

  @ViewChild('inputFoto') private readonly inputFoto!: ElementRef<HTMLInputElement>;

  protected readonly form: PerfilUsuarioForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(30)],
    }),
    documentNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(30)],
    }),
  });

  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;

  protected readonly nombreNavbar = computed(() => {
    const perfil = this.perfil();
    const usuario = this.usuario();
    return perfil?.firstName || usuario?.firstName || this.usuarioService.nombreNavbar();
  });

  protected readonly nombreCompleto = computed(() => {
    const perfil = this.perfil();
    if (!perfil) return 'Mi perfil';
    return `${perfil.firstName} ${perfil.lastName}`.trim();
  });

  protected readonly iniciales = computed(() => {
    const perfil = this.perfil();
    const first = perfil?.firstName?.[0] ?? '';
    const last = perfil?.lastName?.[0] ?? '';
    return `${first}${last}`.toUpperCase() || 'U';
  });

  protected readonly fotoPerfil = computed(
    () => this.perfil()?.urlFotoPerfil ?? null,
  );

  ngOnInit(): void {
    void this.cargarPerfil();
  }

  protected async cargarPerfil(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const [usuario, perfil] = await Promise.all([
        this.perfilUsuarioService.obtenerUsuarioLogueado(),
        this.perfilUsuarioService.obtenerPerfil(),
      ]);

      this.usuario.set(usuario);
      this.aplicarPerfil(perfil);
      this.usuarioService.setNombreNavbar(perfil.firstName || usuario.firstName);
    } catch (err) {
      console.error('Error cargando el perfil del usuario:', err);
      this.error.set('No pudimos cargar tu perfil. Probá de nuevo en unos minutos.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async guardar(): Promise<void> {
    if (this.guardando() || this.cargando()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.mostrar('Revisá los campos marcados.', 'error');
      return;
    }

    const actual = this.perfil();
    if (!actual) return;

    const cambios = this.obtenerCambios(actual);
    if (Object.keys(cambios).length === 0) {
      this.toastService.mostrar('No hay cambios para guardar.', 'info');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    try {
      const actualizado =
        await this.perfilUsuarioService.actualizarPerfil(cambios);
      this.aplicarPerfil(actualizado);
      this.usuario.set(this.mapearUsuarioDesdePerfil(actualizado));
      this.usuarioService.setNombreNavbar(actualizado.firstName);
      this.toastService.mostrar('Perfil actualizado correctamente.', 'success');
    } catch (err) {
      console.error('Error actualizando el perfil:', err);
      this.toastService.mostrar('No se pudo actualizar el perfil.', 'error');
    } finally {
      this.guardando.set(false);
    }
  }

  protected descartarCambios(): void {
    const perfil = this.perfil();
    if (!perfil) return;
    this.form.reset(this.valoresDesdePerfil(perfil));
    this.form.markAsPristine();
  }

  protected abrirSelectorFoto(): void {
    this.inputFoto.nativeElement.click();
  }

  protected async onFotoSeleccionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      this.toastService.mostrar('Solo se permiten imágenes JPG, PNG o WEBP.', 'error');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.toastService.mostrar('La imagen no puede superar los 5 MB.', 'error');
      return;
    }

    this.subiendoFoto.set(true);
    try {
      const perfilActualizado = await this.perfilUsuarioService.subirFotoPerfil(archivo);
      this.aplicarPerfil(perfilActualizado);
      this.toastService.mostrar('Foto de perfil actualizada.', 'success');
    } catch {
      this.toastService.mostrar('No se pudo subir la foto. Intentá de nuevo.', 'error');
    } finally {
      this.subiendoFoto.set(false);
      input.value = '';
    }
  }

  protected volver(): void {
    this.router.navigateByUrl(this.usuarioService.homeUrl());
  }

  protected campoInvalido(campo: keyof PerfilUsuarioForm['controls']): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  protected rolLabel(role: string | undefined): string {
    switch (role) {
      case 'PADRE':
        return 'Tutor';
      case 'ALUMNO':
        return 'Alumno';
      case 'VENDEDOR':
        return 'Kiosquero';
      default:
        return 'Usuario';
    }
  }

  private aplicarPerfil(perfil: PerfilUsuario): void {
    this.perfil.set(perfil);
    this.form.reset(this.valoresDesdePerfil(perfil));
    this.form.markAsPristine();
  }

  private valoresDesdePerfil(perfil: PerfilUsuario): PerfilUsuarioForm['value'] {
    return {
      firstName: perfil.firstName ?? '',
      lastName: perfil.lastName ?? '',
      phone: perfil.phone ?? '',
      documentNumber: perfil.documentNumber ?? '',
    };
  }

  private obtenerCambios(
    actual: PerfilUsuario,
  ): ActualizarPerfilUsuarioRequest {
    const valores = this.form.getRawValue();
    const cambios: ActualizarPerfilUsuarioRequest = {};

    this.agregarCambio(cambios, 'firstName', valores.firstName, actual.firstName);
    this.agregarCambio(cambios, 'lastName', valores.lastName, actual.lastName);
    this.agregarCambio(cambios, 'phone', valores.phone, actual.phone ?? '');
    this.agregarCambio(
      cambios,
      'documentNumber',
      valores.documentNumber,
      actual.documentNumber ?? '',
    );

    return cambios;
  }

  private agregarCambio<K extends keyof ActualizarPerfilUsuarioRequest>(
    cambios: ActualizarPerfilUsuarioRequest,
    campo: K,
    valorFormulario: string,
    valorActual: string,
  ): void {
    const valor = valorFormulario.trim();
    if (valor !== valorActual.trim()) {
      (cambios as Record<K, string>)[campo] = valor;
    }
  }

  private mapearUsuarioDesdePerfil(perfil: PerfilUsuario): UsuarioLogueado {
    return {
      id: perfil.id,
      email: perfil.email,
      firstName: perfil.firstName,
      lastName: perfil.lastName,
      role: perfil.role,
    };
  }
}
