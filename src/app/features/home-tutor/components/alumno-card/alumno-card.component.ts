import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { MovimientosService } from '../../../movimientos/services/movimientos.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { MicrocreditosService, SchoolCredit } from '../../../../data-access/services/microcreditos.service';

const formateadorSaldo = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-alumno-card',
  templateUrl: './alumno-card.component.html',
  styleUrl: './alumno-card.component.css',
  imports: [RouterLink, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlumnoCardComponent implements OnInit {
  @Input({ required: true }) alumno!: Alumno;

  private readonly movimientosService = inject(MovimientosService);
  private readonly perfilService = inject(PerfilService);
  private readonly microcreditosService = inject(MicrocreditosService);
  private readonly _cantidadPendientes = signal<number>(0);
  creditoActivo = signal<SchoolCredit | null>(null);

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
    return `${this.alumno.nombre} ${this.alumno.apellido}`;
  }

  get iniciales(): string {
    const ini = (this.alumno.nombre[0] ?? '') + (this.alumno.apellido[0] ?? '');
    return ini.toUpperCase();
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

  // --- Lógica Modal Microcrédito ---
  showMicrocreditoModal = signal<boolean>(false);
  tipoMonto = signal<'fijo' | 'porcentaje'>('porcentaje');
  montoFijo = signal<number>(5000);
  porcentaje = signal<number>(50);
  cuotas = signal<number>(1);
  ultimaRecarga = signal<number>(0);
  baseRecargaManual = signal<number>(10000);
  calculandoRecarga = signal<boolean>(false);

  abrirModalMicrocredito(): void {
    this.showMicrocreditoModal.set(true);
    
    if (this.creditoActivo()) {
      return; // No calculamos recarga si ya hay crédito activo
    }

    this.tipoMonto.set('porcentaje');
    this.porcentaje.set(50);
    this.cuotas.set(1);
    this.calculandoRecarga.set(true);
    
    if (this.alumno?.id) {
      this.microcreditosService.getLastRecharge(this.alumno.id).subscribe({
        next: (res) => {
          this.ultimaRecarga.set(res || 0);
          this.calculandoRecarga.set(false);
        },
        error: () => {
          this.ultimaRecarga.set(0);
          this.calculandoRecarga.set(false);
        }
      });
    }
  }

  cerrarModalMicrocredito(): void {
    this.showMicrocreditoModal.set(false);
  }

  get baseCalculo(): number {
    return this.ultimaRecarga() > 0 ? this.ultimaRecarga() : this.baseRecargaManual();
  }

  get montoCalculado(): number {
    if (this.tipoMonto() === 'fijo') {
      return this.montoFijo();
    }
    return (this.baseCalculo * this.porcentaje()) / 100;
  }

  setMontoRapido(porc: number): void {
    this.montoFijo.set((this.baseCalculo * porc) / 100);
  }

  setCuotas(c: number): void {
    this.cuotas.set(c);
  }

  confirmarMicrocredito(): void {
    const parentId = this.perfilService.perfil()?.id;
    if (!parentId || !this.alumno?.id) return;
    
    const finalAmount = this.montoCalculado;
    if (finalAmount <= 0) {
      alert('El monto debe ser mayor a cero.');
      return;
    }

    this.microcreditosService.requestCredit(this.alumno.id, parentId, finalAmount, this.cuotas())
      .subscribe({
        next: (res) => {
          alert('Microcrédito habilitado exitosamente por: $' + res.amount);
          this.creditoActivo.set(res);
          this.cerrarModalMicrocredito();
        },
        error: (err) => {
          console.error('Error HTTP:', err);
          if (err.status === 409) {
            alert('El alumno ya tiene un microcrédito activo.');
          } else {
            alert('Error al solicitar microcrédito: ' + (err.error || err.message));
          }
        }
      });
  }
}
