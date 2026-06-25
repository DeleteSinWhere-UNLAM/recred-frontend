import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLinkActive } from '@angular/router';
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
  imports: [RouterLinkActive, FormsModule, CropModalComponent],
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
  private readonly _cantidadPendientes = signal<number>(0);
  creditoActivo = signal<SchoolCredit | null>(null);
  mostrarTodosLosBotones = signal<boolean>(false);
  readonly subiendoFoto = signal(false);
  protected readonly fotoEvent = signal<Event | null>(null);

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

  readonly budgetLimit = 1000;

  get budgetSpent(): number {
    const nombre = this.alumno.nombre.toLowerCase();
    if (nombre.includes('eugenio')) return 450;
    if (nombre.includes('emmanuel')) return 700;
    if (nombre.includes('adrian')) return 850;
    if (nombre.includes('rocio')) return 600;
    return 500;
  }

  get budgetPercentage(): number {
    return Math.round((this.budgetSpent / this.budgetLimit) * 100);
  }

  get budgetSpentFormateado(): string {
    return `$${this.budgetSpent}`;
  }

  get budgetLimitFormateado(): string {
    return `$${this.budgetLimit}`;
  }

  get cantidadPendientes(): number {
    return this._cantidadPendientes();
  }

  get esPadre(): boolean {
    return this.perfilService.perfil()?.rol === 'PADRE';
  }

  get esPremium(): boolean {
    return this.perfilService.perfil()?.plan === 'PREMIUM';
  }

}
