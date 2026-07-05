import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { Router } from '@angular/router';
import { CrearBuffetPresenter } from './presenter/crear-buffet.presenter';
import { CrearBuffetFormComponent } from './components/crear-buffet-form/crear-buffet-form.component';
import { CrearBuffetRequest } from '../models/directivo.model';

@Component({
  selector: 'app-crear-buffet-page',
  standalone: true,
  imports: [CrearBuffetFormComponent],
  templateUrl: './crear-buffet.page.html',
  providers: [CrearBuffetPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearBuffetPage implements OnInit {
  protected readonly presenter = inject(CrearBuffetPresenter);
  private readonly router = inject(Router);
  
  schoolId: string | null = null;

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state && nav.extras.state['schoolId']) {
      this.schoolId = nav.extras.state['schoolId'];
    } else {
      const state = history.state;
      if (state && state['schoolId']) {
        this.schoolId = state['schoolId'];
      } else {
        console.warn('No schoolId provided, returning to dashboard');
        this.router.navigate(['/directivo']);
      }
    }
  }

  onSubmit(data: CrearBuffetRequest) {
    if (this.schoolId) {
      this.presenter.crear(this.schoolId, data);
    }
  }
}
