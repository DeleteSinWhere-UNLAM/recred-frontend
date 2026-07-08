import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject, signal, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { AlumnoContextoService } from '../../../../core/services/alumno-contexto.service';
import { FormsModule } from '@angular/forms';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { MovimientosService } from '../../../movimientos/services/movimientos.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { MicrocreditosService, SchoolCredit } from '../../../../data-access/services/microcreditos.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CropModalComponent } from '../../../perfil-usuario/components/crop-modal/crop-modal.component';
import { DialogService } from '../../../../shared/services/dialog.service';
import { PresupuestoService } from '../../../presupuesto/services/presupuesto.service';
import { getPeriodRange } from '../../../compra/utils/budget-helpers';

type PlanFamiliaHome = 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO';
type PlanRequeridoAccion = Exclude<PlanFamiliaHome, 'GRATUITO'>;

const formateadorSaldo = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-alumno-card',
  standalone: true,
  templateUrl: './alumno-card.component.html',
  styleUrl: './alumno-card.component.css',
  imports: [FormsModule, CropModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlumnoCardComponent implements OnInit {
  @Input({ required: true }) alumno!: Alumno;

  private readonly alumnosService = inject(AlumnosService);
  private readonly movimientosService = inject(MovimientosService);
  private readonly perfilService = inject(PerfilService);
  private readonly microcreditosService = inject(MicrocreditosService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly _cantidadPendientes = signal<number>(0);
  
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  creditoActivo = signal<SchoolCredit | null>(null);
  mostrarTodosLosBotones = signal<boolean>(false);
  readonly subiendoFoto = signal(false);
  protected readonly fotoEvent = signal<Event | null>(null);

  readonly hasBudget = signal<boolean>(false);
  readonly budgetLimit = signal<number>(1000);
  readonly budgetSpent = signal<number>(0);

  @ViewChild('inputFotoAlumno') private readonly inputFotoAlumno!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    if (this.alumno?.id) {
      this.movimientosService.getPendientesAlumno(this.alumno.id).subscribe({
        next: (movimientos) => {
          this._cantidadPendientes.set(movimientos.length);
        },
        error: (err) => {
          console.error('Error fetching pending purchases for student:', err);
        },
      });
      this.microcreditosService.getActiveCredit(this.alumno.id).subscribe({
        next: (credito) => this.creditoActivo.set(credito),
        error: () => this.creditoActivo.set(null)
      });
      this.cargarPresupuestoYConsumo();
    }
  }

  private async cargarPresupuestoYConsumo(): Promise<void> {
    try {
      const budget = await this.presupuestoService.getPresupuesto(this.alumno.id);
      if (budget && budget.activo) {
        this.hasBudget.set(true);
        this.budgetLimit.set(budget.montoLimiteGeneral);

        this.movimientosService.getHistorialAlumno(this.alumno.id).subscribe({
          next: (history) => {
            if (!history) {
              this.budgetSpent.set(0);
              return;
            }
            const referenceDate = new Date();
            const { start, end } = getPeriodRange(budget.periodo, referenceDate);
            const activeStatuses = ['APPROVED', 'PENDING', 'PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];
            
            const approvedPastPurchases = history.filter((m) => {
              if (!activeStatuses.includes(m.status)) return false;
              const purchaseDate = m.pickupDate ? new Date(m.pickupDate + 'T12:00:00') : new Date(m.date);
              return purchaseDate >= start && purchaseDate <= end;
            });

            const spentPastGeneral = approvedPastPurchases.reduce((acc, m) => acc + m.totalAmount, 0);
            this.budgetSpent.set(spentPastGeneral);
          },
          error: (err) => {
            console.error('Error fetching student purchase history for budget calculation:', err);
            this.budgetSpent.set(0);
          }
        });
      } else {
        this.hasBudget.set(false);
        this.budgetLimit.set(1000);
        this.budgetSpent.set(0);
      }
    } catch (err) {
      console.error('Error loading budget:', err);
      this.hasBudget.set(false);
    }
  }

  get nombreCompleto(): string {
    return this.alumno.nombre;
  }

  get iniciales(): string {
    return (this.alumno.nombre[0] ?? '').toUpperCase();
  }

  toggleBotones(): void {
    this.mostrarTodosLosBotones.update(v => !v);
  }

  /**
   * Establece el alumno activo en el servicio de contexto y navega a la ruta.
   * Esto permite URLs limpias (sin UUID) en todas las rutas de alumno.
   */
  navegar(ruta: string): void {
    this.contextoService.setAlumnoId(this.alumno.id);
    void this.router.navigate([ruta]);
  }

  navegarConPlan(ruta: string, planRequerido?: PlanRequeridoAccion): void {
    if (planRequerido && this.planBloqueado(planRequerido)) {
      this.toastService.mostrar(`Disponible con plan ${this.planLabel(planRequerido)}.`, 'info');
      return;
    }

    this.navegar(ruta);
  }

  get fotoPerfil(): string | null {
    return this.alumno.urlFotoPerfil ?? null;
  }

  abrirSelectorFoto(): void {
    this.inputFotoAlumno.nativeElement.click();
  }

  async onFotoSeleccionada(event: Event): Promise<void> {
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
      await this.alumnosService.subirFotoAlumno(this.alumno.id, archivoRecortado);
      this.toastService.mostrar('Foto actualizada correctamente.', 'success');
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

  get saldoFormateado(): string {
    return formateadorSaldo.format(this.alumno.saldo);
  }

  get saldoNegativo(): boolean {
    return this.alumno.saldo < 0;
  }

  get saldoBajo(): boolean {
    return this.alumno.saldo < 500;
  }

  get budgetPercentage(): number {
    const limit = this.budgetLimit();
    if (limit <= 0) return 0;
    const remaining = Math.max(0, limit - this.budgetSpent());
    return Math.round((remaining / limit) * 100);
  }

  get budgetRestanteFormateado(): string {
    const restante = Math.max(0, this.budgetLimit() - this.budgetSpent());
    return formateadorSaldo.format(restante);
  }

  get budgetLimitFormateado(): string {
    return formateadorSaldo.format(this.budgetLimit());
  }

  get cantidadPendientes(): number {
    return this._cantidadPendientes();
  }

  get esPadre(): boolean {
    return this.perfilService.perfil()?.rol === 'PADRE';
  }

  get esPremium(): boolean {
    return !this.perfilService.esPlanGratuito();
  }

  planBloqueado(planRequerido: PlanRequeridoAccion): boolean {
    return this.nivelPlan(this.planActualFamilia()) < this.nivelPlan(planRequerido);
  }

  planLabel(plan: PlanRequeridoAccion): string {
    return plan === 'AVANZADO' ? 'Avanzado' : 'Intermedio';
  }

  isActive(ruta: string): boolean {
    const url = this.currentUrl();
    if (!url) return false;
    // Check both route and context
    return this.contextoService.alumnoId() === this.alumno.id && url.includes(ruta);
  }

  private planActualFamilia(): PlanFamiliaHome {
    const plan = this.perfilService.perfil()?.plan?.toUpperCase();
    if (plan === 'INTERMEDIO' || plan === 'AVANZADO') return plan;
    return 'GRATUITO';
  }

  private nivelPlan(plan: PlanFamiliaHome): number {
    if (plan === 'AVANZADO') return 2;
    if (plan === 'INTERMEDIO') return 1;
    return 0;
  }

}
