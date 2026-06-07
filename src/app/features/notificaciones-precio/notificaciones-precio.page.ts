import { Component, inject } from '@angular/core';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';

import { NotificacionesPrecioService } from './services/notificaciones-precio.service';
import { NotificacionPrecio } from './models/notificacion-precio.model';

import { NotificacionPrecioCardComponent } from './components/notificacion-precio-card/notificacion-precio-card';

@Component({
  selector: 'app-notificaciones-precio-page',
  standalone: true,
  templateUrl: './notificaciones-precio.page.html',
  styleUrl: './notificaciones-precio.page.css',
  imports: [NavbarComponent, NotificacionPrecioCardComponent],
})
export class NotificacionesPrecioPage {
  private readonly usuarioService = inject(UsuarioService);

  private readonly notificacionesService = inject(NotificacionesPrecioService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  notificaciones: NotificacionPrecio[] = [];

  constructor() {
    const perfilRaw = localStorage.getItem('recred.perfil');

    const usuarioId = perfilRaw ? JSON.parse(perfilRaw).id : null;

    console.log('ID DESDE LOCALSTORAGE:', usuarioId);

    if (usuarioId) {
      this.notificacionesService
        .getNotificaciones(usuarioId)
        .subscribe((data) => {
          this.notificaciones = data;

          console.log('NOTIFICACIONES:', data);
        });
    }
  }
}
