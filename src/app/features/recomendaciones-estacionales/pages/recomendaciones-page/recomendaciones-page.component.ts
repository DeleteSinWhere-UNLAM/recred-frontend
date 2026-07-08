import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaEstacionalComponent } from '../../components/lista-estacional/lista-estacional.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { RecomendacionesPagePresenter } from './presenter/recomendaciones-page.presenter';
import { ModalAprobarPromocionIaComponent } from '../../components/modal-aprobar-promocion-ia/modal-aprobar-promocion-ia.component';
import { UsuarioService } from '../../../../data-access/services/usuario.service';

@Component({
  selector: 'app-seasonal-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ListaEstacionalComponent, ModalAprobarPromocionIaComponent],
  providers: [RecomendacionesPagePresenter],
  templateUrl: './recomendaciones-page.component.html',
  styleUrls: ['./recomendaciones-page.component.css']
})
export class RecomendacionesPageComponent implements OnInit {
  protected readonly presenter = inject(RecomendacionesPagePresenter);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
  }

  ngOnInit(): void {
    this.presenter.loadRecommendations();
  }
}
