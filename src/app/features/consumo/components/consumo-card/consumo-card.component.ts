import { Component, Input } from '@angular/core';

import { ConsumoAprendizaje } from '../../../../core/models/consumo-aprendizaje.model';

@Component({
  selector: 'app-consumo-card',
  templateUrl: './consumo-card.component.html',
  styleUrl: './consumo-card.component.css',
})
export class ConsumoCardComponent {

  @Input({ required: true })
  consumo!: ConsumoAprendizaje;

}