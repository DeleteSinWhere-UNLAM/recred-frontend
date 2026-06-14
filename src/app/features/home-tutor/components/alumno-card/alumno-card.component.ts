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
}
