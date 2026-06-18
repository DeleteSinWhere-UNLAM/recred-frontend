import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorDashboardService } from './services/tutor-dashboard.service';
import { TutorGlobalDashboardSummary, ChildDashboardSummary } from './models/tutor-dashboard.model';
import { GridsterConfig, GridsterItemConfig, Gridster, GridsterItem } from 'angular-gridster2';
import { SmartChartWidget, ChartWidgetConfig } from './components/smart-chart-widget/smart-chart-widget';

export interface DashboardWidget extends GridsterItemConfig {
  id: string;
  type: string;
  studentId?: string;
  widgetConfig?: ChartWidgetConfig;
}

@Component({
  selector: 'app-tutor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, Gridster, GridsterItem, SmartChartWidget],
  templateUrl: './tutor-dashboard.component.html',
  styleUrls: ['./tutor-dashboard.component.css']
})
export class TutorDashboardComponent implements OnInit {
  private dashboardService = inject(TutorDashboardService);
  
  globalSummary: TutorGlobalDashboardSummary | null = null;
  selectedChild: ChildDashboardSummary | null = null;
  isLoading = true;
  
  // Modals state
  showSmartActionModal = false;
  
  // Transfer state
  draggedChild: ChildDashboardSummary | null = null;
  transferAmounts: Record<string, number | null> = {};

  // Grid state
  gridConfig: GridsterConfig = {};
  dashboardItems: DashboardWidget[] = [];

  ngOnInit(): void {
    this.initGrid();
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.dashboardService.getGlobalDashboard().subscribe({
      next: (data) => {
        this.globalSummary = data;
        
        // Load layout from backend if available, else localStorage, else default
        if (data.dashboardConfig) {
          try {
            this.dashboardItems = JSON.parse(data.dashboardConfig);
          } catch (e) {
            console.error('Failed to parse backend dashboard config', e);
            this.loadLocalOrDefaultLayout();
          }
        } else {
          this.loadLocalOrDefaultLayout();
        }

        if (data.children && data.children.length > 0) {
          // Keep the previous selection if it exists
          if (this.selectedChild) {
            this.selectedChild = data.children.find(c => c.studentId === this.selectedChild?.studentId) || data.children[0];
          } else {
            this.selectedChild = data.children[0];
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard', err);
        this.isLoading = false;
      }
    });
  }

  selectChild(child: ChildDashboardSummary): void {
    this.selectedChild = child;
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  get isLowBalance(): boolean {
    return (this.selectedChild?.balance ?? 0) < 1000;
  }

  get budgetPercentage(): number {
    if (!this.selectedChild?.budget) return 0;
    const { spent, limit } = this.selectedChild.budget;
    return Math.min((spent / limit) * 100, 100);
  }

  get budgetColorClass(): string {
    const percentage = this.budgetPercentage;
    if (percentage < 60) return 'budget-green';
    if (percentage < 85) return 'budget-yellow';
    return 'budget-red';
  }
  
  // Drag and Drop Logic
  onDragStart(event: DragEvent, child: ChildDashboardSummary): void {
    this.draggedChild = child;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', child.studentId);
      event.dataTransfer.effectAllowed = 'copyMove';
    }
    const target = event.target as HTMLElement;
    target.classList.add('dragging');
  }

  onDragEnd(event: DragEvent): void {
    this.draggedChild = null;
    const target = event.target as HTMLElement;
    target.classList.remove('dragging');
    
    document.querySelectorAll('.child-transfer-card').forEach(el => {
      el.classList.remove('drag-over');
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Necessary to allow dropping
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }

  onDrop(event: DragEvent, targetChild: ChildDashboardSummary): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');

    if (this.draggedChild && this.draggedChild.studentId !== targetChild.studentId) {
      const sourceChild = this.draggedChild;
      const amount = this.transferAmounts[sourceChild.studentId];
      
      if (amount && amount > 0) {
        this.dashboardService.transferBalance(sourceChild.studentId, targetChild.studentId, amount).subscribe({
          next: () => {
            console.log(`Successfully transferred $${amount} from ${sourceChild.studentName} to ${targetChild.studentName}`);
            this.transferAmounts[sourceChild.studentId] = null; // reset the input
            this.ngOnInit(); // Refresh dashboard to fetch updated balances
          },
          error: (err) => {
            console.error('Transfer failed', err);
            alert('Hubo un error al procesar la transferencia. Revisa el monto o la conexión.');
          }
        });
      } else {
        alert('Debes ingresar un monto mayor a 0 antes de arrastrar para transferir.');
      }
    }
  }

  openSmartActionModal(): void {
    this.showSmartActionModal = true;
  }
  
  closeSmartActionModal(): void {
    this.showSmartActionModal = false;
  }
  
  applySmartAction(): void {
    console.log('Action applied for', this.selectedChild?.studentName);
    this.closeSmartActionModal();
  }

  initGrid() {
    this.gridConfig = {
      gridType: 'fit',
      compactType: 'none',
      margin: 16,
      outerMargin: true,
      minCols: 1,
      maxCols: 12,
      minItemCols: 3,
      minItemRows: 3,
      minRows: 1,
      maxRows: 100,
      draggable: {
        enabled: true,
        ignoreContent: true, // only drag from header
        dragHandleClass: 'drag-handler'
      },
      resizable: {
        enabled: true
      },
      displayGrid: 'onDrag&Resize',
      pushItems: true,
      swap: true,
      itemChangeCallback: () => this.saveLayout(),
      itemResizeCallback: () => this.saveLayout()
    };

    // Load layout logic is now handled after fetching global summary
  }

  private loadLocalOrDefaultLayout() {
    const savedLayout = localStorage.getItem('tutorDashboardGrid');
    if (savedLayout) {
      try {
        this.dashboardItems = JSON.parse(savedLayout);
        return;
      } catch (e) {
        console.error('Failed to parse saved grid layout', e);
      }
    }

    // Default layout
    this.dashboardItems = [
      { id: 'smart-1', type: 'smart-chart', cols: 4, rows: 3, y: 0, x: 0, widgetConfig: { chartType: 'bar', dataSource: 'finance' } },
      { id: 'finance', type: 'finance', cols: 3, rows: 3, y: 0, x: 4 },
      { id: 'health', type: 'health', cols: 3, rows: 3, y: 0, x: 7 },
      { id: 'logistics', type: 'logistics', cols: 4, rows: 3, y: 3, x: 0 },
      { id: 'transactions', type: 'transactions', cols: 6, rows: 3, y: 3, x: 4 }
    ];
  }

  onWidgetConfigChange(item: DashboardWidget, newConfig: ChartWidgetConfig) {
    item.widgetConfig = newConfig;
    this.saveLayout();
  }

  saveLayout() {
    const configStr = JSON.stringify(this.dashboardItems);
    localStorage.setItem('tutorDashboardGrid', configStr);
    
    // Persist to backend
    this.dashboardService.saveDashboardConfig(configStr).subscribe({
      next: () => console.log('Dashboard layout saved to backend'),
      error: (err) => console.error('Error saving dashboard layout to backend', err)
    });
  }

  private getNextPosition() {
    const maxY = this.dashboardItems.reduce((max, item) => Math.max(max, item.y + item.rows), 0);
    return { x: 0, y: maxY };
  }

  addSmartCard() {
    const pos = this.getNextPosition();
    this.dashboardItems.push({
      id: 'smart-' + Date.now(),
      type: 'smart-chart',
      cols: 4,
      rows: 3,
      x: pos.x,
      y: pos.y,
      widgetConfig: { chartType: 'bar', dataSource: 'finance' }
    });
    this.saveLayout();
  }

  addFinanceCard() {
    const pos = this.getNextPosition();
    this.dashboardItems.push({
      id: 'finance-' + Date.now(),
      type: 'finance',
      cols: 3,
      rows: 3,
      x: pos.x,
      y: pos.y,
      studentId: this.globalSummary?.children[0]?.studentId
    });
    this.saveLayout();
  }

  addHealthCard() {
    const pos = this.getNextPosition();
    this.dashboardItems.push({
      id: 'health-' + Date.now(),
      type: 'health',
      cols: 3,
      rows: 3,
      x: pos.x,
      y: pos.y,
      studentId: this.globalSummary?.children[0]?.studentId
    });
    this.saveLayout();
  }

  addLogisticsCard() {
    const pos = this.getNextPosition();
    this.dashboardItems.push({
      id: 'logistics-' + Date.now(),
      type: 'logistics',
      cols: 4,
      rows: 3,
      x: pos.x,
      y: pos.y,
      studentId: this.globalSummary?.children[0]?.studentId
    });
    this.saveLayout();
  }

  addTransactionsCard() {
    const pos = this.getNextPosition();
    this.dashboardItems.push({
      id: 'transactions-' + Date.now(),
      type: 'transactions',
      cols: 4,
      rows: 3,
      x: pos.x,
      y: pos.y,
      studentId: this.globalSummary?.children[0]?.studentId
    });
    this.saveLayout();
  }

  removeCard(id: string) {
    this.dashboardItems = this.dashboardItems.filter(item => item.id !== id);
    this.saveLayout();
  }

  clearAllCards() {
    if (confirm('¿Estás seguro de que quieres eliminar todas las tarjetas del panel?')) {
      this.dashboardItems = [];
      this.saveLayout();
    }
  }

  getChildData(item: DashboardWidget): ChildDashboardSummary | null {
    if (!this.globalSummary || !this.globalSummary.children) return null;
    
    // Si la tarjeta tiene un estudiante asociado, devolverlo
    if (item.studentId) {
      const found = this.globalSummary.children.find(c => c.studentId === item.studentId);
      if (found) return found;
    }
    
    // Si no tiene estudiante asignado o no se encuentra, usar el primer hijo como default y guardarlo en el item
    const defaultChild = this.globalSummary.children[0];
    if (defaultChild) {
      item.studentId = defaultChild.studentId;
      return defaultChild;
    }
    
    return null;
  }
}
