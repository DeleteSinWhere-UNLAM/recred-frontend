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
import { PayoutConfigService } from '../../data-access/services/payout-config.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { PayoutConfig } from '../../data-access/models/payout-config.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { CropModalComponent } from './components/crop-modal/crop-modal.component';

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
  imports: [NavbarComponent, ReactiveFormsModule, CropModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilUsuarioPage implements OnInit {
  private readonly perfilUsuarioService = inject(PerfilUsuarioService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly payoutConfigService = inject(PayoutConfigService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly usuario = signal<UsuarioLogueado | null>(null);
  protected readonly perfil = signal<PerfilUsuario | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly subiendoFoto = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fotoEvent = signal<Event | null>(null);

  protected readonly cargandoPayout = signal(false);
  protected readonly guardandoPayout = signal(false);
  protected readonly errorPayout = signal<string | null>(null);
  protected readonly tienePayoutExistente = signal(false);
  protected readonly proximaEjecucion = signal<string | null>(null);
  protected readonly ultimaEjecucion = signal<string | null>(null);

  protected readonly esKiosquero = computed(() => {
    const role = this.usuario()?.role || this.perfil()?.role;
    return role === 'VENDEDOR';
  });

  protected readonly planUsuario = computed(() => {
    return this.perfilService.perfil()?.plan;
  });

  protected readonly esTutor = computed(() => {
    const role = this.usuario()?.role || this.perfil()?.role;
    return role === 'PADRE';
  });

  protected readonly esPremium = computed(() => {
    return this.planUsuario() === 'PREMIUM';
  });

  protected readonly payoutForm = new FormGroup({
    destinationCvu: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d{22}$/),
      ],
    }),
    destinationCuit: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d{11}$/),
      ],
    }),
    accountHolderName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    cantidadIntervalo: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    unidadIntervalo: new FormControl<'DAYS' | 'WEEKS' | 'MONTHS'>('DAYS', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    estado: new FormControl<'ACTIVE' | 'PAUSED' | 'CANCELLED'>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

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

      if (usuario.role === 'VENDEDOR' || perfil.role === 'VENDEDOR') {
        await this.cargarConfiguracionPayout();
      }
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
      input.value = '';
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.toastService.mostrar('La imagen no puede superar los 5 MB.', 'error');
      input.value = '';
      return;
    }

    this.fotoEvent.set(event);
  }

  protected async onFotoRecortada(blob: Blob): Promise<void> {
    const event = this.fotoEvent();
    if (!event) return;

    const input = event.target as HTMLInputElement;
    const originalFile = input.files?.[0];
    if (!originalFile) return;

    this.fotoEvent.set(null);
    this.subiendoFoto.set(true);

    try {
      const archivoRecortado = new File([blob], originalFile.name, { type: 'image/webp' });
      const perfilActualizado = await this.perfilUsuarioService.subirFotoPerfil(archivoRecortado);
      this.aplicarPerfil(perfilActualizado);
      this.toastService.mostrar('Foto de perfil actualizada.', 'success');
    } catch {
      this.toastService.mostrar('No se pudo subir la foto. Intentá de nuevo.', 'error');
    } finally {
      this.subiendoFoto.set(false);
      input.value = '';
    }
  }

  protected onCancelarRecorte(): void {
    const event = this.fotoEvent();
    if (event) {
      (event.target as HTMLInputElement).value = '';
    }
    this.fotoEvent.set(null);
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

  protected async cargarConfiguracionPayout(): Promise<void> {
    const kiosqueroId = this.perfilService.obtenerBuffetId();
    if (!kiosqueroId) {
      console.warn('No se encontró el ID del kiosquero para cargar la configuración de pagos.');
      return;
    }

    this.cargandoPayout.set(true);
    this.errorPayout.set(null);

    try {
      const config = await this.payoutConfigService.obtenerConfiguracion(kiosqueroId);
      if (config) {
        this.payoutForm.setValue({
          destinationCvu: config.destinationCvu || '',
          destinationCuit: config.destinationCuit || '',
          accountHolderName: config.accountHolderName || '',
          cantidadIntervalo: config.cantidadIntervalo || 1,
          unidadIntervalo: config.unidadIntervalo || 'DAYS',
          estado: config.estado || 'ACTIVE',
        });
        this.proximaEjecucion.set(config.proximaEjecucion || null);
        this.ultimaEjecucion.set(config.ultimaEjecucion || null);
        this.tienePayoutExistente.set(true);
      }
    } catch (err) {
      console.warn('Error al cargar la configuración de pagos o inexistente:', err);
      this.tienePayoutExistente.set(false);
      this.proximaEjecucion.set(null);
      this.ultimaEjecucion.set(null);
    } finally {
      this.cargandoPayout.set(false);
    }
  }

  protected async guardarPayout(): Promise<void> {
    if (this.guardandoPayout() || this.cargandoPayout()) return;

    if (this.payoutForm.invalid) {
      this.payoutForm.markAllAsTouched();
      this.toastService.mostrar('Revisá los campos de la configuración de pagos.', 'error');
      return;
    }

    const kiosqueroId = this.perfilService.obtenerBuffetId();
    if (!kiosqueroId) {
      this.toastService.mostrar('No se encontró el ID del kiosquero.', 'error');
      return;
    }

    this.guardandoPayout.set(true);
    this.errorPayout.set(null);

    const data: PayoutConfig = this.payoutForm.getRawValue();

    try {
      const response = await this.payoutConfigService.guardarConfiguracion(kiosqueroId, data);
      
      const proxima = response?.proximaEjecucion;
      this.proximaEjecucion.set(proxima || null);
      
      let mensajeExito = 'Vinculación exitosa y configuración guardada correctamente.';
      if (proxima) {
        mensajeExito += ` Próximo pago programado para: ${proxima}`;
      }
      
      this.toastService.mostrar(mensajeExito, 'success');
      this.payoutForm.markAsPristine();
      this.tienePayoutExistente.set(true);
    } catch (err) {
      console.error('Error al guardar la configuración de pagos:', err);
      this.toastService.mostrar('No se pudo procesar la configuración. Por favor, verificá los datos y reintentá.', 'error');
      this.errorPayout.set('No se pudo guardar la configuración. Intentá de nuevo.');
    } finally {
      this.guardandoPayout.set(false);
    }
  }

  protected descartarCambiosPayout(): void {
    this.payoutForm.markAsPristine();
    void this.cargarConfiguracionPayout();
  }

  protected campoPayoutInvalido(campo: keyof typeof this.payoutForm.controls): boolean {
    const control = this.payoutForm.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }
}
