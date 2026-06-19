import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalisisIa } from '../../models/analisis-ia.model';
import { CategoriaMasConsumida } from '../../models/prediccion-gasto.model';

@Component({
  selector: 'app-analisis-prediccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analisis-prediccion.component.html',
  styleUrl: './analisis-prediccion.component.css'
})
export class AnalisisPrediccionComponent {
  @Input() analisisIa: AnalisisIa | null = null;
  @Input() categoriasMasConsumidas: CategoriaMasConsumida[] = [];
}
