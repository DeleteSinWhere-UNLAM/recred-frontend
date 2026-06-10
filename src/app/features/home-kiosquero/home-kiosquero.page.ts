import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AccionesGridComponent } from './components/acciones-grid/acciones-grid.component';
import { PerfilKiosqueroHeaderComponent } from './components/perfil-kiosquero-header/perfil-kiosquero-header.component';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-home-kiosquero-page',
  templateUrl: './home-kiosquero.page.html',
  styleUrl: './home-kiosquero.page.css',
  imports: [
    NavbarComponent,
    PerfilKiosqueroHeaderComponent,
    AccionesGridComponent,
  ],
  providers: [HomeKiosqueroPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeKiosqueroPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(HomeKiosqueroPresenter);

  private readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');
    this.presenter.init();
    this.usuarioService.setNombreNavbar(this.presenter.nombreKiosquero());
    this.notificationService.requestNotificationPermission();
  }
}
