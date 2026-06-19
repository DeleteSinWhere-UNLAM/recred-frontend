import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sugerencia } from '../../models/recomendacion.model';
import { RecomendacionCardComponent } from '../recomendacion-card/recomendacion-card.component';
import { ConsejoCardComponent } from '../consejo-card/consejo-card.component';

@Component({
  selector: 'app-lista-estacional',
  standalone: true,
  imports: [CommonModule, ConsejoCardComponent, RecomendacionCardComponent],
  templateUrl: './lista-estacional.component.html',
  styleUrls: ['./lista-estacional.component.css']
})
export class ListaEstacionalComponent {
  @Input({ required: true }) sugerencias: Sugerencia[] = [];
  @Input() tipPromocional: string | null = null;
}
