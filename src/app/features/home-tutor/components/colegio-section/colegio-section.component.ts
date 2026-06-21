import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { Colegio } from '../../../../data-access/models/colegio.model';
import { AlumnoCardComponent } from '../alumno-card/alumno-card.component';

@Component({
  selector: 'app-colegio-section',
  templateUrl: './colegio-section.component.html',
  styleUrl: './colegio-section.component.css',
  imports: [AlumnoCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColegioSectionComponent {
  @Input({ required: true }) colegio!: Colegio;
  @Input({ required: true }) alumnos!: Alumno[];
  @Input() expandido = true;
  @Output() toggleExpandido = new EventEmitter<void>();

  toggle(): void {
    this.toggleExpandido.emit();
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
