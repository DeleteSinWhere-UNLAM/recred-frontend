import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IaAnalysis } from '../../models/spending-prediction.interface';

@Component({
  selector: 'app-prediction-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-analysis.component.html',
  styleUrl: './prediction-analysis.component.css'
})
export class PredictionAnalysisComponent {
  @Input() analisisIa: IaAnalysis | null = null;
  @Input() categoriasMasConsumidas: string[] = [];
}
