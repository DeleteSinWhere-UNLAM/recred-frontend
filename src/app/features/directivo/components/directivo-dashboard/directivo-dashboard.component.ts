import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-directivo-dashboard',
  standalone: true,
  templateUrl: './directivo-dashboard.component.html',
  styleUrl: './directivo-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectivoDashboardComponent {}
