import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { Router } from '@angular/router';
import { AsignarVendedorPresenter } from './presenter/asignar-vendedor.presenter';
import { AsignarVendedorFormComponent } from './components/asignar-vendedor-form/asignar-vendedor-form.component';
import { CrearVendedorRequest } from '../models/directivo.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-asignar-vendedor-page',
  standalone: true,
  imports: [AsignarVendedorFormComponent, NavbarComponent],
  templateUrl: './asignar-vendedor.page.html',
  providers: [AsignarVendedorPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsignarVendedorPage implements OnInit {
  protected readonly presenter = inject(AsignarVendedorPresenter);
  private readonly router = inject(Router);
  
  buffetId: string | null = null;
  buffetName = '';

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state && nav.extras.state['buffetId']) {
      this.buffetId = nav.extras.state['buffetId'];
      this.buffetName = nav.extras.state['buffetName'] || '';
    } else {
      const state = history.state;
      if (state && state['buffetId']) {
        this.buffetId = state['buffetId'];
        this.buffetName = state['buffetName'] || '';
      } else {
        console.warn('No buffetId provided, returning to dashboard');
        this.router.navigate(['/directivo']);
      }
    }
  }

  onSubmit(data: CrearVendedorRequest) {
    if (this.buffetId) {
      this.presenter.asignar(this.buffetId, data);
    }
  }
}
