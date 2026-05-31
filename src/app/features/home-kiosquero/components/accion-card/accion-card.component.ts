import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { AccionKiosquero } from '../../models/accion-kiosquero.model';

@Component({
  selector: 'app-accion-card',
  templateUrl: './accion-card.component.html',
  styleUrl: './accion-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccionCardComponent {
  @Input({ required: true }) accion!: AccionKiosquero;
  @Input() destacada = false;
  @Output() seleccionar = new EventEmitter<AccionKiosquero>();

  protected onClick(): void {
    this.seleccionar.emit(this.accion);
  }
}
