import { Component, Input } from '@angular/core';

import { SugerenciaProducto } from '../../../../data-access/models/sugerencia-producto.model';

@Component({
  selector: 'app-sugerencia-card',
  templateUrl: './sugerencia-card.component.html',
  styleUrl: './sugerencia-card.component.css',
})
export class SugerenciaCardComponent {

  @Input({ required: true })
  sugerencia!: SugerenciaProducto;

}