import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Movimiento } from '../../../movimientos/models/movimiento.model';

@Component({
  selector: 'app-tendencia-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './tendencia-card.component.html',
  styleUrl: './tendencia-card.component.css'
})
export class TendenciaCardComponent implements OnChanges {
  @Input() historial: Movimiento[] = [];

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value))
        }
      }
    }
  };
  
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Gasto Diario',
      fill: true,
      tension: 0.4,
      borderColor: '#81B29A',
      backgroundColor: 'rgba(129, 178, 154, 0.2)'
    }]
  };
  
  public lineChartType: ChartType = 'line';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['historial'] && this.historial.length > 0) {
      this.procesarHistorial();
    }
  }

  private procesarHistorial() {
    // Agrupar por fecha
    const gastosPorDia = new Map<string, number>();
    
    // Asumimos que date es un string ISO
    const compras = this.historial.filter(m => m.status === 'ENTREGADO' || m.status === 'COMPLETADA' || m.status === 'APROBADO' || m.tipo === 'PRESENCIAL');
    
    compras.forEach(m => {
      const fecha = new Date(m.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      const actual = gastosPorDia.get(fecha) ?? 0;
      gastosPorDia.set(fecha, actual + m.totalAmount);
    });

    // Ordenar por fecha cronológicamente
    // Como la key es DD/MMM necesitamos ordenarlos usando el string original o solo invirtiendo 
    // pero this.historial suele venir ordenado descendente.
    // Lo más seguro es agrupar por YYYY-MM-DD y luego ordenar y formatear
    const agruparReal = new Map<string, { total: number, label: string }>();
    compras.forEach(m => {
      const dateObj = new Date(m.date);
      const key = dateObj.toISOString().split('T')[0];
      const label = dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      const actual = agruparReal.get(key) ?? { total: 0, label };
      actual.total += m.totalAmount;
      agruparReal.set(key, actual);
    });

    const sortedKeys = Array.from(agruparReal.keys()).sort();
    
    const labels = sortedKeys.map(k => agruparReal.get(k)!.label);
    const data = sortedKeys.map(k => agruparReal.get(k)!.total);

    this.lineChartData = {
      labels,
      datasets: [{
        data,
        label: 'Gasto Diario',
        fill: true,
        tension: 0.4,
        borderColor: '#81B29A',
        backgroundColor: 'rgba(129, 178, 154, 0.2)'
      }]
    };
  }
}
