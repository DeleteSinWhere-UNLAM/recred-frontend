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
  @Input() periodo = '';
  @Input() fechaCalculo = '';
  @Input() fechaInicio = '';
  @Input() fechaFin = '';
  @Input() gastoActual = 0;
  @Input() gastoPredicho = 0;
  @Input() promedioGastoDiario = 0;
  @Input() montoLimite: number | null = null;
  @Input() porcentajePresupuesto: number | null = null;
  @Input() confianza = 0;
  @Input() diasHistoricosUsados = 0;
  @Input() diasRestantes = 0;
}
