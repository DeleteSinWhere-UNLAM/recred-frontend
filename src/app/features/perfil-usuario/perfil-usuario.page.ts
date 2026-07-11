import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ActualizarPerfilUsuarioRequest,
  PerfilUsuario,
  UsuarioLogueado,
} from '../../data-access/models/perfil-usuario.model';
import { PerfilUsuarioService } from '../../data-access/services/perfil-usuario.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PayoutConfigService } from '../home-kiosquero/services/payout-config.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { PayoutConfig } from '../../data-access/models/payout-config.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { CropModalComponent } from './components/crop-modal/crop-modal.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { BuffetService } from '../buffet/services/buffet.service';

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
  private readonly authService = inject(AuthService);
  private readonly buffetService = inject(BuffetService);

  protected readonly usuario = signal<UsuarioLogueado | null>(null);
  protected readonly passwordForm = new FormGroup({
    oldPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly guardandoPassword = signal(false);
  protected readonly mostrarModalPassword = signal(false);
  protected readonly mostrarOldPassword = signal(false);
  protected readonly mostrarNewPassword = signal(false);
  protected readonly mostrarConfirmPassword = signal(false);
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
  protected readonly cvuGuardado = signal<string | null>(null);
  protected readonly cuitGuardado = signal<string | null>(null);

  protected readonly habilitarFinesDeSemana = new FormControl<boolean>(false);
  protected readonly guardandoBuffetSettings = signal(false);

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

  protected readonly esDirectivo = computed(() => {
    const role = this.usuario()?.role || this.perfil()?.role;
    return role === 'DIRECTIVO_COLEGIO';
  });

  protected readonly esPremium = computed(() => {
    const plan = this.planUsuario();
    return plan === 'INTERMEDIO' || plan === 'AVANZADO';
  });

  protected readonly planActualLabel = computed(() => {
    const plan = this.planUsuario();
    if (plan === 'AVANZADO') return 'Avanzado';
    if (plan === 'INTERMEDIO') return 'Intermedio';
    return 'Gratuito';
  });

  protected readonly vigenciaPlan = computed(() => {
    if (!this.esPremium()) return 'Sin vencimiento';

    const fecha = this.perfil()?.fechaVencimientoPlan;
    return this.formatearFechaVencimiento(fecha) ?? 'Sin vencimiento';
  });

  protected readonly estadoLicenciaColegio = computed(() => {
    const estado = this.perfil()?.estadoLicenciaColegio || this.perfil()?.licenciaColegio?.estado;
    if (estado) return this.normalizarEstadoLicencia(estado);

    const dias = this.diasRestantesLicenciaColegio();
    if (dias === null) return 'Pendiente de pago';
    return dias >= 0 ? 'Activa' : 'Vencida';
  });

  protected readonly vigenciaLicenciaColegio = computed(() => {
    const fecha = this.fechaVencimientoLicenciaColegio();
    return this.formatearFechaVencimiento(fecha) ?? 'Sin vigencia activa';
  });

  protected readonly restanteLicenciaColegio = computed(() => {
    const dias = this.diasRestantesLicenciaColegio();
    if (dias === null) return 'Sin licencia registrada';
    if (dias < 0) return 'Licencia vencida';
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Resta 1 día';
    return `Restan ${dias} días`;
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

  protected readonly unidadIntervaloSeleccionada = toSignal(
    this.payoutForm.controls.unidadIntervalo.valueChanges,
    { initialValue: this.payoutForm.controls.unidadIntervalo.value }
  );

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

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    void this.cargarPerfil();

    this.payoutForm.controls.unidadIntervalo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((unidad) => {
        const cantidadActual = this.payoutForm.controls.cantidadIntervalo.value;
        if (unidad === 'DAYS' && cantidadActual !== 1 && cantidadActual !== 10) {
          this.payoutForm.controls.cantidadIntervalo.setValue(1);
        } else if (unidad === 'WEEKS' && cantidadActual !== 1 && cantidadActual !== 2) {
          this.payoutForm.controls.cantidadIntervalo.setValue(1);
        } else if (unidad === 'MONTHS' && cantidadActual !== 1 && cantidadActual !== 2 && cantidadActual !== 3) {
          this.payoutForm.controls.cantidadIntervalo.setValue(1);
        }
      });
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

      const role = usuario.role || perfil.role;
      if (role === 'ALUMNO') {
        this.usuarioService.setHomeUrl('/alumno');
      } else if (role === 'VENDEDOR') {
        this.usuarioService.setHomeUrl('/kiosquero');
      } else if (role === 'PADRE') {
        this.usuarioService.setHomeUrl('/tutor');
      } else if (role === 'DIRECTIVO_COLEGIO') {
        this.usuarioService.setHomeUrl('/directivo');
      }

      if (role === 'VENDEDOR') {
        await this.cargarConfiguracionPayout();
        this.cargarConfiguracionBuffet();
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
      case 'DIRECTIVO_COLEGIO':
        return 'Directivo';
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

  private formatearFechaVencimiento(fecha: string | null | undefined): string | null {
    if (!fecha?.trim()) return null;

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return null;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private fechaVencimientoLicenciaColegio(): string | null | undefined {
    const perfil = this.perfil();
    return (
      perfil?.licenciaColegio?.fechaVencimiento
      ?? perfil?.fechaVencimientoLicenciaColegio
      ?? perfil?.fechaVencimientoSuscripcionColegio
      ?? perfil?.fechaVencimientoLicencia
      ?? null
    );
  }

  private diasRestantesLicenciaColegio(): number | null {
    const fecha = this.fechaVencimientoLicenciaColegio();
    if (!fecha?.trim()) return null;

    const vencimiento = new Date(fecha);
    if (Number.isNaN(vencimiento.getTime())) return null;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
    const inicioVencimiento = new Date(
      vencimiento.getFullYear(),
      vencimiento.getMonth(),
      vencimiento.getDate(),
    ).getTime();
    return Math.ceil((inicioVencimiento - inicioHoy) / 86_400_000);
  }

  private normalizarEstadoLicencia(estado: string): string {
    const normalizado = estado.toUpperCase();
    if (normalizado === 'ACTIVA' || normalizado === 'ACTIVE') return 'Activa';
    if (normalizado === 'PENDIENTE' || normalizado === 'PENDING') return 'Pendiente';
    if (normalizado === 'VENCIDA' || normalizado === 'EXPIRED') return 'Vencida';
    if (normalizado === 'CANCELADA' || normalizado === 'CANCELLED') return 'Cancelada';
    return estado;
  }

  protected async cargarConfiguracionPayout(): Promise<void> {
    const kiosqueroId = this.usuario()?.id || this.perfil()?.id;
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
        this.cvuGuardado.set(config.destinationCvu || null);
        this.cuitGuardado.set(config.destinationCuit || null);
      }
    } catch (err) {
      console.warn('Error al cargar la configuración de pagos o inexistente:', err);
      this.tienePayoutExistente.set(false);
      this.proximaEjecucion.set(null);
      this.ultimaEjecucion.set(null);
      this.cvuGuardado.set(null);
      this.cuitGuardado.set(null);
      
      const doc = this.perfil()?.documentNumber;
      if (doc) {
        this.payoutForm.patchValue({ destinationCuit: doc });
      }
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

    const kiosqueroId = this.usuario()?.id || this.perfil()?.id;
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
      this.cvuGuardado.set(response?.destinationCvu || data.destinationCvu);
      this.cuitGuardado.set(response?.destinationCuit || data.destinationCuit);

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

  protected cargarConfiguracionBuffet(): void {
    const kiosqueroId = this.usuario()?.id || this.perfil()?.id;
    if (!kiosqueroId) return;

    const buffetId = this.perfilService.obtenerBuffetId();
    if (!buffetId) return;

    this.buffetService.obtenerBuffetDelAlumno(kiosqueroId).subscribe({
      next: (buffet) => {
        if (buffet) {
          this.habilitarFinesDeSemana.setValue(!!buffet.habilitarVentasAnticipadasNoLaborables, { emitEvent: false });
        }
      },
      error: (err) => console.warn('No se pudo cargar la configuración del buffet:', err)
    });
  }

  protected guardarBuffetSettings(): void {
    if (this.guardandoBuffetSettings()) return;
    
    const buffetId = this.perfilService.obtenerBuffetId();
    if (!buffetId) return;

    this.guardandoBuffetSettings.set(true);
    const value = !!this.habilitarFinesDeSemana.value;
    
    this.buffetService.updateSettings(buffetId, value).subscribe({
      next: () => {
        this.toastService.mostrar('Configuración de ventas anticipadas actualizada', 'success');
        this.habilitarFinesDeSemana.markAsPristine();
      },
      error: () => {
        this.toastService.mostrar('Error al guardar configuración de ventas anticipadas', 'error');
      },
      complete: () => {
        this.guardandoBuffetSettings.set(false);
      }
    });
  }

  protected abrirModalPassword(): void {
    this.passwordForm.reset();
    this.mostrarOldPassword.set(false);
    this.mostrarNewPassword.set(false);
    this.mostrarConfirmPassword.set(false);
    this.mostrarModalPassword.set(true);
  }

  protected cerrarModalPassword(): void {
    if (this.guardandoPassword()) return;
    this.mostrarModalPassword.set(false);
    this.passwordForm.reset();
    this.mostrarOldPassword.set(false);
    this.mostrarNewPassword.set(false);
    this.mostrarConfirmPassword.set(false);
  }

  protected async cambiarPassword(): Promise<void> {
    if (this.guardandoPassword() || this.cargando()) return;

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.toastService.mostrar('Revisá los campos del cambio de contraseña.', 'error');
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      this.toastService.mostrar('La nueva contraseña y la confirmación no coinciden.', 'error');
      return;
    }

    this.guardandoPassword.set(true);
    try {
      await this.authService.cambiarPassword(oldPassword, newPassword);
      this.toastService.mostrar('Contraseña cambiada exitosamente.', 'success');
      this.cerrarModalPassword();
    } catch (err: unknown) {
      console.error('Error al cambiar la contraseña:', err);
      const mensaje = err instanceof Error ? err.message : 'Error al cambiar la contraseña. Verificá los datos.';
      this.toastService.mostrar(mensaje, 'error');
    } finally {
      this.guardandoPassword.set(false);
    }
  }

  protected campoPasswordInvalido(campo: keyof typeof this.passwordForm.controls): boolean {
    const control = this.passwordForm.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }
}

