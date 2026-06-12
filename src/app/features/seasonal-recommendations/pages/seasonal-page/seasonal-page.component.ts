import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeasonalListComponent } from '../../components/seasonal-list/seasonal-list.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SeasonalPagePresenter } from './presenter/seasonal-page.presenter';
import { IaPromotionApprovalModalComponent } from '../../components/ia-promotion-approval-modal/ia-promotion-approval-modal.component';

@Component({
  selector: 'app-seasonal-page',
  standalone: true,
  imports: [CommonModule, SeasonalListComponent, NavbarComponent, IaPromotionApprovalModalComponent],
  providers: [SeasonalPagePresenter],
  templateUrl: './seasonal-page.component.html',
  styleUrls: ['./seasonal-page.component.css']
})
export class SeasonalPageComponent implements OnInit {
  protected readonly presenter = inject(SeasonalPagePresenter);

  ngOnInit(): void {
    this.presenter.loadRecommendations();
  }
}
