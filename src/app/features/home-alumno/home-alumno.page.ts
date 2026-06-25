import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { AccionesGridComponent } from './components/acciones-grid/acciones-grid.component';
import { PedidoRecreoCardComponent } from './components/pedido-recreo-card/pedido-recreo-card.component';
import { PerfilHeaderComponent } from './components/perfil-header/perfil-header.component';
import { HomeAlumnoPresenter } from './presenter/home-alumno.presenter';

@Component({
  selector: 'app-home-alumno-page',
  templateUrl: './home-alumno.page.html',
  styleUrl: './home-alumno.page.css',
  imports: [NavbarComponent, 
    
    PerfilHeaderComponent,
    AccionesGridComponent,
    PedidoRecreoCardComponent,
  ],
  providers: [HomeAlumnoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeAlumnoPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(HomeAlumnoPresenter);

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/alumno');
    this.presenter.init();
    this.usuarioService.setNombreNavbar(this.presenter.nombreAlumno());
  }
}
