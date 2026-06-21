import { Component, Input, Output, EventEmitter, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ChildDashboardSummary } from '../../models/tutor-dashboard.model';

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

  getBarGradient(context: any, colorStart: string, colorEnd: string) {
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

  updateChart() {
    const child = this.children.find(c => c.studentId === this.selectedChildId);
    if (!child) return;

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
          backgroundColor: (context: any) => this.getBarGradient(context, '#4A6FA5', '#81B29A'), // pizarra to menta
          borderRadius: 16,
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
          backgroundColor: (context: any) => this.getBarGradient(context, '#4A6FA5', '#81B29A'), // pizarra to menta
          borderRadius: 16,
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
          backgroundColor: (context: any) => this.getBarGradient(context, '#4A6FA5', '#81B29A'), // pizarra to menta
          borderRadius: 16,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      };
    }
  }
}
