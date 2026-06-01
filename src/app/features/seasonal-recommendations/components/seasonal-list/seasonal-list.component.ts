import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sugerencia } from '../../models/recomendacion.model';
import { RecommendationCardComponent } from '../recommendation-card/recommendation-card.component';
import { TipCardComponent } from '../tip-card/tip-card.component';

@Component({
  selector: 'app-seasonal-list',
  standalone: true,
  imports: [CommonModule, TipCardComponent, RecommendationCardComponent],
  templateUrl: './seasonal-list.component.html',
  styleUrls: ['./seasonal-list.component.css']
})
export class SeasonalListComponent {
  @Input({ required: true }) sugerencias: Sugerencia[] = [];
  @Input() tipPromocional: string | null = null;
}
