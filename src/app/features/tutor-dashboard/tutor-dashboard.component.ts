import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorDashboardService } from './services/tutor-dashboard.service';
import { TutorGlobalDashboardSummary, ChildDashboardSummary } from './models/tutor-dashboard.model';

@Component({
  selector: 'app-tutor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutor-dashboard.component.html',
  styleUrls: ['./tutor-dashboard.component.css']
})
export class TutorDashboardComponent implements OnInit {
  private dashboardService = inject(TutorDashboardService);
  
  globalSummary: TutorGlobalDashboardSummary | null = null;
  selectedChild: ChildDashboardSummary | null = null;
  isLoading = true;
  
  showTransferModal = false;
  showSmartActionModal = false;

  ngOnInit(): void {
    this.dashboardService.getGlobalDashboard().subscribe({
      next: (data) => {
        this.globalSummary = data;
        if (data.children && data.children.length > 0) {
          this.selectedChild = data.children[0];
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
  
  openTransferModal(): void {
    this.showTransferModal = true;
  }
  
  closeTransferModal(): void {
    this.showTransferModal = false;
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
}
