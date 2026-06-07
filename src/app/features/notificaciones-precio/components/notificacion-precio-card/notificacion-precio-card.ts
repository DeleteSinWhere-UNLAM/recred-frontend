import { Component, Input } from '@angular/core';

import { NotificacionPrecio } from '../../models/notificacion-precio.model';

@Component({
  selector: 'app-notificacion-precio-card',
  standalone: true,
  templateUrl: './notificacion-precio-card.html',
  styleUrl: './notificacion-precio-card.css',
})
export class NotificacionPrecioCardComponent {
  @Input({ required: true })
  notificacion!: NotificacionPrecio;
}
