import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-prediction-summary',
  standalone: true,
  imports: [CommonModule, DecimalPipe, PercentPipe, DatePipe],
  templateUrl: './resumen-prediccion.component.html',
  styleUrl: './resumen-prediccion.component.css'
})
export class ResumenPrediccionComponent {
  @Input() periodo = '';
  @Input() fechaCalculo = '';
  @Input() fechaInicio = '';
  @Input() fechaFin = '';
  @Input() gastoActual = 0;
  @Input() gastoPredicho = 0;
  @Input() promedioGastoDiario = 0;
  @Input() montoLimite: number | null = null;
  @Input() porcentajePresupuesto: number | null = null;
  @Input() diasHistoricosUsados = 0;
  @Input() diasRestantes = 0;

  get porcentajeActualPorc(): number {
    return Math.min((this.porcentajePresupuesto || 0) * 100, 100);
  }

  get porcentajePredichoPorc(): number {
    if (!this.montoLimite || this.montoLimite <= 0) return 0;
    // Calculate how much the predicted spending takes of the limit
    const predictedRatio = this.gastoPredicho / this.montoLimite;
    return Math.min(predictedRatio * 100, 100);
  }
}
