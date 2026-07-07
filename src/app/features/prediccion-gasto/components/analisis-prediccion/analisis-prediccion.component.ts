import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AnalisisIa } from '../../models/analisis-ia.interface';
import { CategoriaMasConsumida } from '../../models/prediccion-gasto.interface';

@Component({
  selector: 'app-prediction-analysis',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './analisis-prediccion.component.html',
  styleUrl: './analisis-prediccion.component.css'
})
export class AnalisisPrediccionComponent implements OnChanges {
  @Input() analisisIa: AnalisisIa | null = null;
  @Input() categoriasMasConsumidas: CategoriaMasConsumida[] = [];

  totalCategorias = 0;

  // Opciones del gráfico Doughnut
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      }
    }
  };
  
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      { data: [], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }
    ]
  };
  
  public doughnutChartType: ChartType = 'doughnut';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoriasMasConsumidas'] && this.categoriasMasConsumidas) {
      this.totalCategorias = this.categoriasMasConsumidas.reduce((sum, c) => sum + c.montoTotal, 0);
      
      this.doughnutChartData = {
        labels: this.categoriasMasConsumidas.map(c => c.descripcion),
        datasets: [
          {
            data: this.categoriasMasConsumidas.map(c => c.montoTotal),
            backgroundColor: ['#81B29A', '#E07A5F', '#F2CC8F', '#3D405B', '#4EA8DE', '#E5989B']
          }
        ]
      };
    }
  }

  formatearDinero(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(monto);
  }
}
