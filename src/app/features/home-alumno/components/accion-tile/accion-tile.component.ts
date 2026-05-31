import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AccionRapida } from '../../models/accion-rapida.model';

@Component({
  selector: 'app-accion-tile',
  templateUrl: './accion-tile.component.html',
  styleUrl: './accion-tile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccionTileComponent {
  @Input({ required: true }) accion!: AccionRapida;
  @Output() seleccionar = new EventEmitter<AccionRapida>();

  protected onClick(): void {
    this.seleccionar.emit(this.accion);
  }

  protected get colorClass(): string {
    return `accion-tile--${this.accion.color}`;
  }

  protected get esPlaceholder(): boolean {
    return this.accion.ruta === null;
  }
}
