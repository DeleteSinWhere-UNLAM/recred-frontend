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

  selectedChildId = '';
  selectedChartType: ChartType = 'bar';
  selectedDataSource = 'finance'; // finance, health, logistics

  chartData: ChartData<'bar' | 'pie' | 'line'> = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' }
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
          backgroundColor: ['#e2e8f0', '#f43f5e', '#10b981']
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
          backgroundColor: ['#3b82f6', '#cbd5e1']
        }]
      };
    } else if (this.selectedDataSource === 'logistics') {
       this.chartData = {
        labels: ['Retiros Pendientes', 'Retiros Completados'],
        datasets: [{
          data: [child.todayPickups?.length || 0, 0],
          label: 'Logística de Entregas',
          backgroundColor: ['#f59e0b', '#10b981']
        }]
      };
    }
  }
}
