import { Component, Input, Output, EventEmitter, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ChildDashboardSummary } from '../../models/tutor-dashboard.model';

interface ScriptContext {
  chart: {
    ctx: CanvasRenderingContext2D;
    chartArea?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  dataIndex?: number;
}

export interface ChartWidgetConfig {
  childId?: string;
  chartType?: ChartType;
  dataSource?: string;
}

@Component({
  selector: 'app-smart-chart-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './smart-chart-widget.html',
  styleUrl: './smart-chart-widget.css'
})
export class SmartChartWidget implements OnInit, OnChanges {
  @Input() children: ChildDashboardSummary[] = [];
  @Input() config: ChartWidgetConfig = {}; // { id, childId, chartType, dataSource }
  @Output() configChange = new EventEmitter<ChartWidgetConfig>();
  @Output() closeCard = new EventEmitter<void>();

  selectedChildId = '';
  selectedChartType: ChartType = 'bar';
  selectedDataSource = 'finance'; // finance, health, logistics

  chartData: ChartData<'bar' | 'pie' | 'line'> = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 24
      }
    },
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false }
      },
      y: {
        display: false,
        grid: { display: false }
      }
    }
  };

  chartPlugins = [
    {
      id: 'valueLabels',
      afterDatasetsDraw: (chart: any) => {
        const { ctx, data } = chart;
        ctx.save();
        ctx.font = 'bold 11px Inter, sans-serif';
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.fillStyle = isDarkMode ? '#cbd5e1' : '#475569';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        data.datasets.forEach((dataset: any, datasetIndex: number) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          meta.data.forEach((element: any, index: number) => {
            const val = dataset.data[index];
            if (val !== undefined && val !== null) {
              const isPieOrDoughnut = chart.config.type === 'pie' || chart.config.type === 'doughnut';
              if (isPieOrDoughnut) return;

              let displayVal = val.toString();
              const label = dataset.label || '';
              if (label.includes('Finanzas') || label.includes('($)')) {
                displayVal = `$${val.toLocaleString('es-AR')}`;
              } else if (label.includes('Salud') || label.includes('Pts')) {
                displayVal = `${val.toLocaleString('es-AR')} pts`;
              } else if (label.includes('Logística') || label.includes('Entregas')) {
                displayVal = `${val.toLocaleString('es-AR')}`;
              }

              const position = element.tooltipPosition();
              ctx.fillText(displayVal, position.x, position.y - 6);
            }
          });
        });
        ctx.restore();
      }
    }
  ];

  ngOnInit() {
    this.selectedChildId = this.config.childId || (this.children.length > 0 ? this.children[0].studentId : '');
    this.selectedChartType = this.config.chartType || 'bar';
    this.selectedDataSource = this.config.dataSource || 'finance';
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['children'] && !changes['children'].firstChange) {
      this.updateChart();
    }
  }

  onConfigChange() {
    this.config.childId = this.selectedChildId;
    this.config.chartType = this.selectedChartType;
    this.config.dataSource = this.selectedDataSource;
    this.configChange.emit(this.config);
    this.updateChart();
  }

  onClose() {
    this.closeCard.emit();
  }

  getBarGradient(context: ScriptContext, colorStart: string, colorEnd: string) {
    const chart = context.chart;
    const {ctx, chartArea} = chart;
    if (!chartArea) {
      return colorEnd;
    }
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  }

  getBackgroundColors(context: ScriptContext, type: string) {
    if (this.selectedChartType !== 'pie' && this.selectedChartType !== 'doughnut') {
      return this.getBarGradient(context, '#4A6FA5', '#81B29A');
    }
    
    const index = context.dataIndex;
    if (type === 'finance') {
      if (index === 0) return '#e2e8f0'; // Presupuesto
      if (index === 1) return '#ef4444'; // Gastado
      if (index === 2) return this.getBarGradient(context, '#4A6FA5', '#81B29A'); // Saldo Disponible
    } else if (type === 'health') {
      if (index === 0) return this.getBarGradient(context, '#4A6FA5', '#81B29A');
      if (index === 1) return '#e2e8f0';
    } else if (type === 'logistics') {
      if (index === 0) return '#f59e0b';
      if (index === 1) return this.getBarGradient(context, '#4A6FA5', '#81B29A');
    }
    return this.getBarGradient(context, '#4A6FA5', '#81B29A');
  }

  updateChart() {
    const child = this.children.find(c => c.studentId === this.selectedChildId);
    if (!child) return;

    const isPieOrDoughnut = this.selectedChartType === 'pie' || this.selectedChartType === 'doughnut';

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: isPieOrDoughnut ? 0 : 24
        }
      },
      plugins: {
        legend: { 
          display: isPieOrDoughnut,
          position: 'bottom',
          labels: {
            usePointStyle: false,
            boxWidth: 20,
            padding: 20
          }
        }
      },
      scales: isPieOrDoughnut ? undefined : {
        x: {
          grid: { display: false },
          border: { display: false }
        },
        y: {
          display: false,
          grid: { display: false }
        }
      }
    };

    if (this.selectedDataSource === 'finance') {
      this.chartData = {
        labels: ['Presupuesto', 'Gastado', 'Saldo Disponible'],
        datasets: [{
          data: [
            child.budget?.limit || 0, 
            child.budget?.spent || 0, 
            child.balance || 0
          ],
          label: 'Finanzas ($)',
          backgroundColor: (context: ScriptContext) => this.getBackgroundColors(context, 'finance'),
          borderRadius: isPieOrDoughnut ? 0 : 16,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      };
    } else if (this.selectedDataSource === 'health') {
      this.chartData = {
        labels: ['Puntos Obtenidos', 'Faltan p/ Siguiente Nivel'],
        datasets: [{
          data: [
            child.health?.rewardPoints || 0, 
            child.health?.pointsToNextLevel || 0
          ],
          label: 'Salud y Gamificación (Pts)',
          backgroundColor: (context: ScriptContext) => this.getBackgroundColors(context, 'health'),
          borderRadius: isPieOrDoughnut ? 0 : 16,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      };
    } else if (this.selectedDataSource === 'logistics') {
       this.chartData = {
        labels: ['Retiros Pendientes', 'Retiros Completados'],
        datasets: [{
          data: [child.todayPickups?.length || 0, 0],
          label: 'Logística de Entregas',
          backgroundColor: (context: ScriptContext) => this.getBackgroundColors(context, 'logistics'),
          borderRadius: isPieOrDoughnut ? 0 : 16,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      };
    }
  }
}
