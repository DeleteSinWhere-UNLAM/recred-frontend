import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SugerenciaProducto } from '../../models/sugerencia-producto.model';

@Component({
  selector: 'app-sugerencia-card',
  templateUrl: './sugerencia-card.component.html',
  styleUrl: './sugerencia-card.component.css',
})
export class SugerenciaCardComponent {
  @Input({ required: true })
  sugerencia!: SugerenciaProducto;

  @Input()
  seleccionada = false;

  @Output()
  seleccionar = new EventEmitter<SugerenciaProducto>();

  onSeleccionar(): void {
    this.seleccionar.emit(this.sugerencia);
  }
}
