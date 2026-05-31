import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { AccionVendedor } from '../../models/accion-vendedor.model';

@Component({
  selector: 'app-accion-card',
  templateUrl: './accion-card.component.html',
  styleUrl: './accion-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccionCardComponent {
  @Input({ required: true }) accion!: AccionVendedor;
  @Input() destacada = false;
  @Output() seleccionar = new EventEmitter<AccionVendedor>();

  protected onClick(): void {
    this.seleccionar.emit(this.accion);
  }
}
