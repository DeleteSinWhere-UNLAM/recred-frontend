import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { Colegio } from '../../../../data-access/models/colegio.model';
import { AlumnoCardComponent } from '../alumno-card/alumno-card.component';

@Component({
  selector: 'app-colegio-section',
  templateUrl: './colegio-section.component.html',
  styleUrl: './colegio-section.component.css',
  imports: [AlumnoCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.colegio-section-colapsado]': '!expandido()',
  },
})
export class ColegioSectionComponent {
  @Input({ required: true }) colegio!: Colegio;
  @Input({ required: true }) alumnos!: Alumno[];

  readonly expandido = signal(true);

  toggle(): void {
    this.expandido.update((v) => !v);
  }

  get totalSaldo(): number {
    return this.alumnos.reduce((sum, a) => sum + a.saldo, 0);
  }

  get totalSaldoFormateado(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(this.totalSaldo);
  }
}
