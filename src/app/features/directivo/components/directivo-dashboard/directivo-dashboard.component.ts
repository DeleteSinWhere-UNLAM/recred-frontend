import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SchoolOverview } from '../../models/directivo.model';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-directivo-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './directivo-dashboard.component.html',
  styleUrl: './directivo-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectivoDashboardComponent {
  @Input() data: SchoolOverview | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
}
