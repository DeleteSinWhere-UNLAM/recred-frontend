import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AccionRapida } from '../../models/accion-rapida.model';
import { AccionTileComponent } from '../accion-tile/accion-tile.component';

@Component({
  selector: 'app-acciones-grid',
  templateUrl: './acciones-grid.component.html',
  styleUrl: './acciones-grid.component.css',
  imports: [AccionTileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccionesGridComponent {
  @Input({ required: true }) acciones: AccionRapida[] = [];
  @Output() accion = new EventEmitter<AccionRapida>();

  protected onSeleccionar(accion: AccionRapida): void {
    this.accion.emit(accion);
  }
}
