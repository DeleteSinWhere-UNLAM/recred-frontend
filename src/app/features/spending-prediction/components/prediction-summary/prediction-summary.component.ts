import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-prediction-summary',
  standalone: true,
  imports: [CommonModule, DecimalPipe, PercentPipe, DatePipe],
  templateUrl: './prediction-summary.component.html',
  styleUrl: './prediction-summary.component.css'
})
export class PredictionSummaryComponent {
  @Input() periodo: string = '';
  @Input() fechaCalculo: string = '';
  @Input() fechaInicio: string = '';
  @Input() fechaFin: string = '';
  @Input() gastoActual: number = 0;
  @Input() gastoPredicho: number = 0;
  @Input() promedioGastoDiario: number = 0;
  @Input() montoLimite: number | null = null;
  @Input() porcentajePresupuesto: number | null = null;
  @Input() confianza: number = 0;
  @Input() diasHistoricosUsados: number = 0;
  @Input() diasRestantes: number = 0;
}
