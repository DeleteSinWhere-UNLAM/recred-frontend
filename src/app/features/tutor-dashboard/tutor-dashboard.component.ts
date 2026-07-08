import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Component, OnDestroy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutorDashboardService } from './services/tutor-dashboard.service';
import { TutorGlobalDashboardSummary, ChildDashboardSummary } from './models/tutor-dashboard.model';
import { GridsterConfig, GridsterItemConfig, Gridster, GridsterItem } from 'angular-gridster2';
import { SmartChartWidget, ChartWidgetConfig } from './components/smart-chart-widget/smart-chart-widget';

import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { DialogService } from '../../shared/services/dialog.service';

export interface DashboardWidget extends GridsterItemConfig {
  id: string;
  type: string;
  studentId?: string;
  widgetConfig?: ChartWidgetConfig;
}

@Component({
  selector: 'app-tutor-dashboard',
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule, Gridster, GridsterItem, SmartChartWidget],
  templateUrl: './tutor-dashboard.component.html',
  styleUrls: ['./tutor-dashboard.component.css']
})
export class TutorDashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(TutorDashboardService);
  private readonly perfilService = inject(PerfilService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);

  readonly nombreUsuario = computed(() => this.perfilService.perfil()?.nombre ?? this.usuarioService.getUsuarioActual().nombre);

  constructor() {
    this.usuarioService.setHomeUrl('/tutor');
    this.usuarioService.setNombreNavbar(this.nombreUsuario());
  }
  
  globalSummary: TutorGlobalDashboardSummary | null = null;
  selectedChild: ChildDashboardSummary | null = null;
  isLoading = true;
  
  // Modals state
  showSmartActionModal = false;
  
  // Transfer state
  draggedChild: ChildDashboardSummary | null = null;
  transferAmounts: Record<string, number | null> = {};
  
  // Modal transfer state
  showTransferModal = false;
  transferSourceChild: ChildDashboardSummary | null = null;
  transferTargetChildId = '';
  isTransferring = false;

  // Grid state
  gridConfig: GridsterConfig = {};
  dashboardItems: DashboardWidget[] = [];

  ngOnInit(): void {
    this.initGrid();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = undefined;
    }
  }

  volver(): void {
    this.router.navigate(['/tutor']);
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
          // Clean children names to only show first name
          data.children = data.children.map(c => ({
            ...c,
            studentName: c.studentName ? c.studentName.split(' ')[0] : ''
          }));

          // Sort children alphabetically
          data.children.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
          
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
  
  get esPlanGratuito(): boolean {
    return this.perfilService.esPlanGratuito();
  }

  get esPremium(): boolean {
    return !this.esPlanGratuito;
  }

  get tienePlanAvanzado(): boolean {
    return this.perfilService.perfil()?.plan?.toUpperCase() === 'AVANZADO';
  }

  get puedeAgregarTarjeta(): boolean {
    return !this.esPlanGratuito || this.dashboardItems.length < 5;
  }

  // Drag and Drop Logic
  onDragStart(event: DragEvent, child: ChildDashboardSummary): void {
    if (!this.tienePlanAvanzado) {
      event.preventDefault();
      return;
    }
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

  async onDrop(event: DragEvent, targetChild: ChildDashboardSummary): Promise<void> {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');

    if (!this.tienePlanAvanzado) {
      await this.dialogService.alert('La transferencia entre hijos esta disponible con plan Avanzado.', 'Plan Avanzado');
      return;
    }

    if (this.draggedChild && this.draggedChild.studentId !== targetChild.studentId) {
      const sourceChild = this.draggedChild;
      const amount = this.transferAmounts[sourceChild.studentId];
      
      if (amount && amount > 0) {
        this.dashboardService.transferBalance(sourceChild.studentId, targetChild.studentId, amount).subscribe({
          next: () => {
            this.transferAmounts[sourceChild.studentId] = null; // reset the input
            this.ngOnInit(); // Refresh dashboard to fetch updated balances
          },
          error: async (err) => {
            console.error('Transfer failed', err);
            await this.dialogService.alert('Hubo un error al procesar la transferencia. Revisa el monto o la conexión.', 'Error de Transferencia');
          }
        });
      } else {
        await this.dialogService.alert('Debes ingresar un monto mayor a 0 antes de arrastrar para transferir.', 'Monto Inválido');
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
    this.closeSmartActionModal();
  }

  // Button Transfer Logic
  openTransferModal(sourceChild: ChildDashboardSummary): void {
    if (!this.tienePlanAvanzado) {
      this.dialogService.alert('La transferencia entre hijos esta disponible con plan Avanzado.', 'Plan Avanzado');
      return;
    }
    
    const amount = this.transferAmounts[sourceChild.studentId];
    if (!amount || amount <= 0) {
      this.dialogService.alert('Debes ingresar un monto mayor a 0 antes de transferir.', 'Monto Inválido');
      return;
    }

    this.transferSourceChild = sourceChild;
    this.transferTargetChildId = '';
    
    // Si solo hay un destinatario posible, autoseleccionarlo
    const possibleTargets = this.globalSummary?.children.filter(c => c.studentId !== sourceChild.studentId) || [];
    if (possibleTargets.length === 1) {
      this.transferTargetChildId = possibleTargets[0].studentId;
    }

    this.showTransferModal = true;
  }

  closeTransferModal(): void {
    if (this.isTransferring) return;
    this.showTransferModal = false;
    this.transferSourceChild = null;
    this.transferTargetChildId = '';
  }

  confirmTransfer(): void {
    if (!this.transferSourceChild || !this.transferTargetChildId) {
      this.dialogService.alert('Debes seleccionar un destinatario.', 'Destinatario Inválido');
      return;
    }
    
    if (this.isTransferring) return;
    
    const amount = this.transferAmounts[this.transferSourceChild.studentId];
    if (!amount || amount <= 0) return;

    const sourceId = this.transferSourceChild.studentId;
    const targetId = this.transferTargetChildId;

    this.isTransferring = true;
    this.dashboardService.transferBalance(sourceId, targetId, amount).subscribe({
      next: () => {
        this.transferAmounts[sourceId] = null;
        this.isTransferring = false;
        this.closeTransferModal();
        this.ngOnInit();
      },
      error: async (err) => {
        console.error('Transfer failed', err);
        this.isTransferring = false;
        await this.dialogService.alert('Hubo un error al procesar la transferencia. Revisa el monto o la conexión.', 'Error de Transferencia');
        this.closeTransferModal();
      }
    });
  }

  initGrid() {
    this.gridConfig = {
      gridType: 'verticalFixed',
      compactType: 'compactUp&Left',
      margin: 16,
      outerMargin: true,
      mobileBreakpoint: 768,
      minCols: 3,
      maxCols: 3,
      maxItemCols: 3,
      minItemCols: 1,
      minItemRows: 1,
      minRows: 1,
      maxRows: 100,
      setGridSize: true,
      fixedRowHeight: 120,
      keepFixedHeightInMobile: true,
      draggable: {
        enabled: true,
        ignoreContent: true, // only drag from header
        dragHandleClass: 'drag-handler'
      },
      resizable: {
        enabled: true
      },
      pushResizeItems: false,
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
      { id: 'smart-1', type: 'smart-chart', cols: 1, rows: 3, y: 0, x: 0, widgetConfig: { chartType: 'bar', dataSource: 'finance' } },
      { id: 'finance', type: 'finance', cols: 1, rows: 3, y: 0, x: 1 },
      { id: 'health', type: 'health', cols: 1, rows: 3, y: 0, x: 2 },
      { id: 'logistics', type: 'logistics', cols: 1, rows: 3, y: 3, x: 0 },
      { id: 'transactions', type: 'transactions', cols: 1, rows: 3, y: 3, x: 1 }
    ];
  }

  onWidgetConfigChange(item: DashboardWidget, newConfig: ChartWidgetConfig) {
    item.widgetConfig = newConfig;
    this.saveLayout();
  }

  private saveTimeout: ReturnType<typeof setTimeout> | undefined;

  saveLayout() {
    const configStr = JSON.stringify(this.dashboardItems);
    localStorage.setItem('tutorDashboardGrid', configStr);
    
    // Persist to backend with debounce
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.dashboardService.saveDashboardConfig(configStr).subscribe({
        next: () => console.log('Dashboard layout saved to backend'),
        error: (err) => console.error('Error saving dashboard layout to backend', err)
      });
    }, 1000);
  }

  private getNextPosition() {
    for (let y = 0; y < 100; y += 3) {
      for (let x = 0; x < 3; x++) {
        const isOccupied = this.dashboardItems.some(item => {
          const itemCols = item.cols || 1;
          const itemRows = item.rows || 3;
          const overlapX = x < (item.x + itemCols) && (x + 1) > item.x;
          const overlapY = y < (item.y + itemRows) && (y + 3) > item.y;
          return overlapX && overlapY;
        });
        if (!isOccupied) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  }

  addSmartCard() {
    const pos = this.getNextPosition();
    this.dashboardItems.push({
      id: 'smart-' + Date.now(),
      type: 'smart-chart',
      cols: 1,
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
      cols: 1,
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
      cols: 1,
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
      cols: 1,
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
      cols: 1,
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

  async clearAllCards() {
    const confirmacion = await this.dialogService.confirm('¿Estás seguro de que quieres eliminar todas las tarjetas del panel?', 'Eliminar Tarjetas');
    if (confirmacion) {
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

  getPickupType(time: string): string {
    if (!time) return '';
    const parts = time.split('(');
    return parts[0].trim();
  }

  getPickupTimeRange(time: string): string {
    if (!time) return '';
    const parts = time.split('(');
    if (parts.length > 1) {
      return parts[1].replace(')', '').trim();
    }
    return '';
  }
}
