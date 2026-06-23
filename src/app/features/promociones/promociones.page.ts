import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PromocionesPagePresenter } from './presenter/promociones.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';

@Component({
  selector: 'app-promociones-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  providers: [PromocionesPagePresenter],
  templateUrl: './promociones.page.html',
  styleUrls: ['./promociones.page.css']
})
export class PromocionesPageComponent implements OnInit {
  public readonly presenter = inject(PromocionesPagePresenter);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  ngOnInit() {
    this.presenter.loadPromotions();
  }
}
