import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { SugerenciaCapacidad } from '../../models/capacidad-asistente.model';

@Component({
  selector: 'app-sugerencias-chips',
  templateUrl: './sugerencias-chips.component.html',
  styleUrl: './sugerencias-chips.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SugerenciasChipsComponent {
  @Input() sugerencias: readonly SugerenciaCapacidad[] = [];
  @Input() deshabilitado = false;

  @Output() elegir = new EventEmitter<string>();

  protected get hint(): string {
    if (this.tieneCompraPendiente) return 'Compra pendiente';
    if (this.tieneSugerenciasBackend) return 'Siguiente paso';
    return 'Opciones rapidas';
  }

  protected get tieneCompraPendiente(): boolean {
    return this.sugerencias.some(
      (s) => s.tipo === 'confirmacion' || s.tipo === 'cancelacion',
    );
  }

  private get tieneSugerenciasBackend(): boolean {
    return this.sugerencias.some((s) => s.tipo === 'backend');
  }

  protected onClick(sugerencia: SugerenciaCapacidad): void {
    if (this.deshabilitado || sugerencia.bloqueada) return;
    this.elegir.emit(sugerencia.prompt);
  }

  protected trackBySugerencia(
    _index: number,
    sugerencia: SugerenciaCapacidad,
  ): string {
    return sugerencia.id;
  }
}
