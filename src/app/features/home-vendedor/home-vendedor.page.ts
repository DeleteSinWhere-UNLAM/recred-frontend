import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AccionesGridComponent } from './components/acciones-grid/acciones-grid.component';
import { PerfilVendedorHeaderComponent } from './components/perfil-vendedor-header/perfil-vendedor-header.component';
import { HomeVendedorPresenter } from './presenter/home-vendedor.presenter';

@Component({
  selector: 'app-home-vendedor-page',
  templateUrl: './home-vendedor.page.html',
  styleUrl: './home-vendedor.page.css',
  imports: [
    NavbarComponent,
    PerfilVendedorHeaderComponent,
    AccionesGridComponent,
  ],
  providers: [HomeVendedorPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeVendedorPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(HomeVendedorPresenter);

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/vendedor');
    this.presenter.init();
    this.usuarioService.setNombreNavbar(this.presenter.nombreVendedor());
  }
}
