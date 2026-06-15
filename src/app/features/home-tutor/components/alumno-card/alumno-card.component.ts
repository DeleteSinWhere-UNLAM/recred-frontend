import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { MovimientosService } from '../../../movimientos/services/movimientos.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { MicrocreditosService } from '../../../../data-access/services/microcreditos.service';

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
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlumnoCardComponent implements OnInit {
  @Input({ required: true }) alumno!: Alumno;

  private readonly movimientosService = inject(MovimientosService);
  private readonly perfilService = inject(PerfilService);
  private readonly microcreditosService = inject(MicrocreditosService);
  private readonly _cantidadPendientes = signal<number>(0);

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

  solicitarMicrocredito(): void {
    const parentId = this.perfilService.perfil()?.id;
    if (!parentId || !this.alumno?.id) return;
    
    this.microcreditosService.enableCredit({ parentId, studentId: this.alumno.id })
      .subscribe({
        next: (res) => {
          alert('Microcrédito habilitado exitosamente por: $' + res.amount);
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
