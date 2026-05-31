import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { AccionVendedor } from '../../models/accion-vendedor.model';
import { AccionCardComponent } from '../accion-card/accion-card.component';

@Component({
  selector: 'app-acciones-grid',
  templateUrl: './acciones-grid.component.html',
  styleUrl: './acciones-grid.component.css',
  imports: [AccionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccionesGridComponent {
  @Input({ required: true }) acciones: AccionVendedor[] = [];
  @Output() accion = new EventEmitter<AccionVendedor>();

  protected onSeleccionar(accion: AccionVendedor): void {
    this.accion.emit(accion);
  }
}
