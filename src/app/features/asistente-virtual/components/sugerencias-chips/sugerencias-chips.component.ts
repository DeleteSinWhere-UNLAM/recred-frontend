import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  CapacidadAsistente,
  SugerenciaCapacidad,
} from '../../models/capacidad-asistente.model';

@Component({
  selector: 'app-sugerencias-chips',
  templateUrl: './sugerencias-chips.component.html',
  styleUrl: './sugerencias-chips.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SugerenciasChipsComponent {
  @Input() sugerencias: readonly SugerenciaCapacidad[] = [];
  @Input() deshabilitado = false;

  @Output() elegir = new EventEmitter<CapacidadAsistente>();

  protected onClick(capacidad: CapacidadAsistente): void {
    if (this.deshabilitado) return;
    this.elegir.emit(capacidad);
  }

  protected trackByCapacidad(_index: number, sugerencia: SugerenciaCapacidad): string {
    return sugerencia.capacidad;
  }
}
