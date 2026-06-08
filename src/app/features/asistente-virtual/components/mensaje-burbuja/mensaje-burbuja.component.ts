import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AccionAsistente } from '../../models/respuesta-asistente.model';
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

  protected get accion(): AccionAsistente | null {
    return this.mensaje.accion ?? null;
  }

  protected get muestraComprobante(): boolean {
    return !this.esUsuario && this.accion?.estado === 'EJECUTADA';
  }

  protected get totalFormateado(): string | null {
    const total = this.accion?.total;
    if (total === null || total === undefined) return null;

    return total.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
    });
  }

  protected valorTexto(valor: string | number | null | undefined): string {
    if (valor === null || valor === undefined) return '-';
    const texto = String(valor).trim();
    return texto.length > 0 ? texto : '-';
  }
}
