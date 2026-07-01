import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NotificacionPrecioCardComponent } from './components/notificacion-precio-card/notificacion-precio-card';
import { NotificacionesPrecioPresenter } from './presenter/notificaciones-precio.presenter';

@Component({
  selector: 'app-notificaciones-precio-page',
  standalone: true,
  templateUrl: './notificaciones-precio.page.html',
  styleUrl: './notificaciones-precio.page.css',
  imports: [CommonModule, NavbarComponent, NotificacionPrecioCardComponent],
  providers: [NotificacionesPrecioPresenter]
})
export class NotificacionesPrecioPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  readonly presenter = inject(NotificacionesPrecioPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual()?.nombre || '';

  ngOnInit(): void {
    this.presenter.initialize();
  }
}
