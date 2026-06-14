import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';

@Component({
  selector: 'app-home-kiosquero-page',
  templateUrl: './home-kiosquero.page.html',
  styleUrl: './home-kiosquero.page.css',
  imports: [NavbarComponent],
  providers: [HomeKiosqueroPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeKiosqueroPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(HomeKiosqueroPresenter);

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');
    this.presenter.init();
  }
}
