import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sugerencia } from '../../models/recomendacion.model';

@Component({
  selector: 'app-recomendacion-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recomendacion-card.component.html',
  styleUrls: ['./recomendacion-card.component.css']
})
export class RecomendacionCardComponent {
  @Input({ required: true }) item!: Sugerencia;
}
