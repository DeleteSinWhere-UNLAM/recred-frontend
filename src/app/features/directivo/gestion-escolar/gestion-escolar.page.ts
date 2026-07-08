import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import {
  FranjaHorariaColegio,
  FranjaHorariaPayload,
  GradoColegio,
  GradoPayload,
} from '../models/gestion-escolar.model';
import { GestionEscolarPresenter } from '../presenter/gestion-escolar.presenter';

type GestionEscolarTab = 'grados' | 'franjas';

type GradoForm = FormGroup<{
  nivelId: FormControl<string>;
  anio: FormControl<string>;
  division: FormControl<string>;
}>;

type FranjaForm = FormGroup<{
  descripcion: FormControl<string>;
  horaInicio: FormControl<string>;
  horaFin: FormControl<string>;
  cupoMaximo: FormControl<number | null>;
  minutosCorte: FormControl<number | null>;
}>;

type BajaPendiente =
  | { tipo: 'grado'; item: GradoColegio }
  | { tipo: 'franja'; item: FranjaHorariaColegio };

@Component({
  selector: 'app-gestion-escolar-page',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './gestion-escolar.page.html',
  styleUrl: './gestion-escolar.page.css',
  providers: [GestionEscolarPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionEscolarPage implements OnInit {
  protected readonly presenter = inject(GestionEscolarPresenter);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tab = signal<GestionEscolarTab>('grados');
  protected readonly gradoEditando = signal<GradoColegio | null>(null);
  protected readonly franjaEditando = signal<FranjaHorariaColegio | null>(null);
  protected readonly bajaPendiente = signal<BajaPendiente | null>(null);

  protected readonly gradoForm: GradoForm = new FormGroup({
    nivelId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    anio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    division: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly franjaForm: FranjaForm = new FormGroup(
    {
      descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      horaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      horaFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      cupoMaximo: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
      minutosCorte: new FormControl<number | null>(0, { validators: [Validators.min(0)] }),
    },
    { validators: [horarioValidoValidator] },
  );

  public ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.tab.set(data['tab'] === 'franjas' ? 'franjas' : 'grados');
    });
    void this.presenter.inicializar();
  }

  protected async guardarGrado(event: Event): Promise<void> {
    event.preventDefault();
    if (this.gradoForm.invalid) {
      this.gradoForm.markAllAsTouched();
      return;
    }

    const value = this.gradoForm.getRawValue();
    const payload: GradoPayload = {
      nivelId: value.nivelId,
      anio: value.anio.trim(),
      division: value.division.trim(),
    };
    const ok = await this.presenter.guardarGrado(payload, this.gradoEditando()?.id);
    if (ok) this.cancelarEdicionGrado();
  }

  protected editarGrado(grado: GradoColegio): void {
    this.gradoEditando.set(grado);
    this.gradoForm.setValue({
      nivelId: grado.nivelId,
      anio: grado.anio,
      division: grado.division,
    });
  }

  protected cancelarEdicionGrado(): void {
    this.gradoEditando.set(null);
    this.gradoForm.reset({ nivelId: '', anio: '', division: '' });
  }

  protected solicitarBajaGrado(grado: GradoColegio): void {
    this.bajaPendiente.set({ tipo: 'grado', item: grado });
  }

  protected async reactivarGrado(grado: GradoColegio): Promise<void> {
    await this.presenter.reactivarGrado(grado.id);
  }

  protected async guardarFranja(event: Event): Promise<void> {
    event.preventDefault();
    if (this.franjaForm.invalid) {
      this.franjaForm.markAllAsTouched();
      return;
    }

    const value = this.franjaForm.getRawValue();
    const payload: FranjaHorariaPayload = {
      descripcion: value.descripcion.trim(),
      horaInicio: this.normalizarHora(value.horaInicio),
      horaFin: this.normalizarHora(value.horaFin),
      cupoMaximo: this.normalizarNumero(value.cupoMaximo),
      minutosCorte: this.normalizarNumero(value.minutosCorte),
    };
    const ok = await this.presenter.guardarFranja(payload, this.franjaEditando()?.id);
    if (ok) this.cancelarEdicionFranja();
  }

  protected editarFranja(franja: FranjaHorariaColegio): void {
    this.franjaEditando.set(franja);
    this.franjaForm.setValue({
      descripcion: franja.descripcion,
      horaInicio: this.horaInput(franja.horaInicio),
      horaFin: this.horaInput(franja.horaFin),
      cupoMaximo: franja.cupoMaximo ?? null,
      minutosCorte: franja.minutosCorte ?? 0,
    });
  }

  protected cancelarEdicionFranja(): void {
    this.franjaEditando.set(null);
    this.franjaForm.reset({
      descripcion: '',
      horaInicio: '',
      horaFin: '',
      cupoMaximo: null,
      minutosCorte: 0,
    });
  }

  protected solicitarBajaFranja(franja: FranjaHorariaColegio): void {
    this.bajaPendiente.set({ tipo: 'franja', item: franja });
  }

  protected async reactivarFranja(franja: FranjaHorariaColegio): Promise<void> {
    await this.presenter.reactivarFranja(franja.id);
  }

  protected horaCorta(hora: string): string {
    return this.horaInput(hora);
  }

  protected cupoTexto(franja: FranjaHorariaColegio): string {
    const cupo = franja.cupoMaximo ?? 0;
    return cupo > 0 ? `${cupo} cupos` : 'Sin limite';
  }

  protected corteTexto(franja: FranjaHorariaColegio): string {
    const minutos = franja.minutosCorte ?? 0;
    return minutos > 0 ? `${minutos} min antes` : 'Sin corte';
  }

  protected accionActual(accion: string): boolean {
    return this.presenter.accionEnCurso() === accion;
  }

  protected tituloConfirmacionBaja(): string {
    const baja = this.bajaPendiente();
    if (!baja) return '';
    return baja.tipo === 'grado'
      ? `Dar de baja el grado ${baja.item.nombre}`
      : `Dar de baja la franja ${baja.item.descripcion}`;
  }

  protected detalleConfirmacionBaja(): string {
    const baja = this.bajaPendiente();
    if (!baja) return '';

    if (baja.tipo === 'grado') {
      return `${baja.item.nivelDescripcion} - Anio ${baja.item.anio} - Division ${baja.item.division}`;
    }

    return `${this.horaCorta(baja.item.horaInicio)} a ${this.horaCorta(baja.item.horaFin)} - ${this.cupoTexto(baja.item)} - ${this.corteTexto(baja.item)}`;
  }

  protected accionBajaPendiente(): string {
    const baja = this.bajaPendiente();
    if (!baja) return '';
    return baja.tipo === 'grado'
      ? `grado-${baja.item.id}-eliminar`
      : `franja-${baja.item.id}-eliminar`;
  }

  protected cerrarConfirmacionBaja(): void {
    if (this.presenter.accionEnCurso()) return;
    this.bajaPendiente.set(null);
  }

  protected async confirmarBaja(): Promise<void> {
    const baja = this.bajaPendiente();
    if (!baja) return;

    if (baja.tipo === 'grado') {
      const ok = await this.presenter.eliminarGrado(baja.item.id);
      if (ok) {
        if (this.gradoEditando()?.id === baja.item.id) this.cancelarEdicionGrado();
        this.bajaPendiente.set(null);
      }
      return;
    }

    const ok = await this.presenter.eliminarFranja(baja.item.id);
    if (ok) {
      if (this.franjaEditando()?.id === baja.item.id) this.cancelarEdicionFranja();
      this.bajaPendiente.set(null);
    }
  }

  private horaInput(hora: string): string {
    return hora?.slice(0, 5) ?? '';
  }

  private normalizarHora(hora: string): string {
    return hora.length === 5 ? `${hora}:00` : hora;
  }

  private normalizarNumero(valor: number | null): number | null {
    if (valor === null || Number.isNaN(valor)) return null;
    return Number(valor);
  }
}

function horarioValidoValidator(control: AbstractControl): ValidationErrors | null {
  const horaInicio = control.get('horaInicio')?.value as string | undefined;
  const horaFin = control.get('horaFin')?.value as string | undefined;
  if (!horaInicio || !horaFin) return null;
  return horaInicio < horaFin ? null : { rangoHorario: true };
}
