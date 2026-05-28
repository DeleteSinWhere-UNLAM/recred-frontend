import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { ReglaCategoria } from '../../models/presupuesto.model';

export interface CambioPorcentaje {
  reglaId: string;
  porcentaje: number;
}

@Component({
  selector: 'app-regla-categoria-item',
  templateUrl: './regla-categoria-item.component.html',
  styleUrl: './regla-categoria-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReglaCategoriaItemComponent {
  private readonly reglaState = signal<ReglaCategoria | undefined>(undefined);

  @Input({ required: true })
  set regla(valor: ReglaCategoria) {
    this.reglaState.set(valor);
  }

  @Output() porcentajeChange = new EventEmitter<CambioPorcentaje>();
  @Output() eliminar = new EventEmitter<string>();

  readonly reglaActual = this.reglaState.asReadonly();

  onSliderChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const regla = this.reglaState();
    if (!regla) return;
    this.porcentajeChange.emit({
      reglaId: regla.id,
      porcentaje: Number(target.value),
    });
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const regla = this.reglaState();
    if (!regla) return;
    this.porcentajeChange.emit({
      reglaId: regla.id,
      porcentaje: Number(target.value),
    });
  }

  onEliminar(): void {
    const regla = this.reglaState();
    if (!regla) return;
    this.eliminar.emit(regla.id);
  }

  formatear(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(monto);
  }
}
