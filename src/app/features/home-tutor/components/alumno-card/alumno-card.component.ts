import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alumno } from '../../../../data-access/models/alumno.model';

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
export class AlumnoCardComponent {
  @Input({ required: true }) alumno!: Alumno;

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
    const nombre = this.alumno.nombre.toLowerCase();
    if (nombre.includes('eugenio')) return 2;
    if (nombre.includes('emmanuel')) return 1;
    if (nombre.includes('adrian')) return 3;
    if (nombre.includes('rocio')) return 2;
    return 0;
  }
}
