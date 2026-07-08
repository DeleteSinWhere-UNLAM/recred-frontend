import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sugerencia } from '../../models/recomendacion.model';

@Component({
  selector: 'app-recommendation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-recomendacion.component.html',
  styleUrls: ['./tarjeta-recomendacion.component.css']
})
export class TarjetaRecomendacionComponent {
  @Input({ required: true }) item!: Sugerencia;
}
