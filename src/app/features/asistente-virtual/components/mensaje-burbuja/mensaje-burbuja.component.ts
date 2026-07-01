import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  AccionAsistente,
  ESTADO_COMPRA_CANCELADO,
  TIPO_ACCION_CANCELACION_COMPRA,
} from '../../models/respuesta-asistente.model';
import { MensajeAsistente } from '../../models/mensaje-asistente.model';

const ESTADO_ACCION_EJECUTADA = 'EJECUTADA';

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
    return (
      !this.esUsuario &&
      this.estadoAccion === ESTADO_ACCION_EJECUTADA &&
      !this.esCancelacionCompra &&
      this.tieneDatosComprobanteCompra
    );
  }

  protected get muestraCancelacionCompra(): boolean {
    return (
      !this.esUsuario &&
      this.estadoAccion === ESTADO_ACCION_EJECUTADA &&
      this.esCancelacionCompra
    );
  }

  protected get estadoCompraTexto(): string {
    return this.valorTexto(this.accion?.estadoCompra);
  }

  protected get totalFormateado(): string | null {
    const total = this.accion?.total;
    if (total === null || total === undefined) return null;

    return total.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      currencyDisplay: 'narrowSymbol',
    });
  }

  private get esCancelacionCompra(): boolean {
    return (
      this.accion?.tipo === TIPO_ACCION_CANCELACION_COMPRA ||
      this.accion?.estadoCompra === ESTADO_COMPRA_CANCELADO
    );
  }

  private get estadoAccion(): string | null {
    return this.accion?.estado ?? this.accion?.status ?? null;
  }

  private get tieneDatosComprobanteCompra(): boolean {
    const accion = this.accion;
    const tieneTotal = accion?.total !== null && accion?.total !== undefined;

    return Boolean(
      accion?.compraId ||
        accion?.codigoRetiro ||
        accion?.estadoCompra ||
        accion?.recreo ||
        tieneTotal,
    );
  }

  protected valorTexto(valor: string | number | null | undefined): string {
    if (valor === null || valor === undefined) return '-';
    const texto = String(valor).trim();
    return texto.length > 0 ? texto : '-';
  }
}
