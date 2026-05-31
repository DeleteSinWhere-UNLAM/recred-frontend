import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { AccionKiosquero } from '../../models/accion-kiosquero.model';
import { AccionCardComponent } from '../accion-card/accion-card.component';

@Component({
  selector: 'app-acciones-grid',
  templateUrl: './acciones-grid.component.html',
  styleUrl: './acciones-grid.component.css',
  imports: [AccionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccionesGridComponent {
  @Input({ required: true }) acciones: AccionKiosquero[] = [];
  @Output() accion = new EventEmitter<AccionKiosquero>();

  protected onSeleccionar(accion: AccionKiosquero): void {
    this.accion.emit(accion);
  }
}
