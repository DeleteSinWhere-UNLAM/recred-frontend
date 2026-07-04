import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DirectivoPresenter } from './presenter/directivo.presenter';
import { DirectivoDashboardComponent } from './components/directivo-dashboard/directivo-dashboard.component';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-directivo-page',
  standalone: true,
  imports: [DirectivoDashboardComponent],
  templateUrl: './directivo.page.html',
  styleUrl: './directivo.page.css',
  providers: [DirectivoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectivoPage implements OnInit {
  protected readonly presenter = inject(DirectivoPresenter);
  private readonly authService = inject(AuthService);

  public ngOnInit(): void {
    this.presenter.inicializar();
  }

  public async cerrarSesion(): Promise<void> {
    await this.authService.logout();
  }
}
