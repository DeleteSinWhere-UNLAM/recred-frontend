import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sugerencia } from '../../models/recomendacion.model';

@Component({
  selector: 'app-recommendation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recommendation-card.component.html',
  styleUrls: ['./recommendation-card.component.css']
})
export class RecommendationCardComponent {
  @Input({ required: true }) item!: Sugerencia;
}
