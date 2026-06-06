import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MensajeAsistente } from '../../models/mensaje-asistente.model';

@Component({
  selector: 'app-mensaje-burbuja',
  templateUrl: './mensaje-burbuja.component.html',
  styleUrl: './mensaje-burbuja.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensajeBurbujaComponent {
  @Input({ required: true }) mensaje!: MensajeAsistente;

  protected get esUsuario(): boolean {
    return this.mensaje.rol === 'usuario';
  }

  protected get horaFormateada(): string {
    return this.mensaje.fechaHora.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
