import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-estadistica-card',
  standalone: true,
  templateUrl: './estadisticas-card.component.html',
  styleUrl: './estadisticas-card.component.css',
})
export class EstadisticaCardComponent {

  @Input({ required: true })
  titulo!: string;

  @Input({ required: true })
  valor!: string;

  @Input({ required: true })
  icono!: string;

}