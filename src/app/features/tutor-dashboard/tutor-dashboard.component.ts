import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorDashboardService } from './services/tutor-dashboard.service';
import { TutorGlobalDashboardSummary, ChildDashboardSummary } from './models/tutor-dashboard.model';

@Component({
  selector: 'app-tutor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  ngOnInit(): void {
    this.isLoading = true;
    this.dashboardService.getGlobalDashboard().subscribe({
      next: (data) => {
        this.globalSummary = data;
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
    // In a real app, call a service here
    console.log('Action applied for', this.selectedChild?.studentName);
    this.closeSmartActionModal();
  }
}
