import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { LicenciaColegio, SchoolOverview, Vendedor } from '../../models/directivo.model';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-directivo-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './directivo-dashboard.component.html',
  styleUrl: './directivo-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectivoDashboardComponent {
  @Input() data: SchoolOverview | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() pagandoLicencia = false;
  @Input() errorPagoLicencia: string | null = null;
  @Output() pagarLicencia = new EventEmitter<void>();

  public vendedorSeleccionado = signal<Vendedor | null>(null);

  public verDetalleVendedor(vendedor: Vendedor): void {
    this.vendedorSeleccionado.set(vendedor);
  }

  public cerrarModal(): void {
    this.vendedorSeleccionado.set(null);
  }

  public buffetsConVendedor(): number {
    return this.data?.buffets.filter((buffet) => !!buffet.vendedor).length ?? 0;
  }

  public buffetsSinVendedor(): number {
    return this.data?.buffets.filter((buffet) => !buffet.vendedor).length ?? 0;
  }

  public iniciarPagoLicencia(): void {
    if (this.pagandoLicencia) return;
    this.pagarLicencia.emit();
  }

  public montoLicencia(): string {
    const licencia = this.obtenerLicencia();
    const moneda = licencia?.moneda || 'USD';
    const monto = licencia?.monto ?? 20;
    return `${moneda} ${monto} / mes`;
  }

  public estadoLicencia(): string {
    const estado = this.obtenerLicencia()?.estado || this.data?.estadoLicencia;
    if (estado) return this.normalizarEstado(estado);

    const dias = this.diasRestantes();
    if (dias === null) return 'Pendiente de pago';
    return dias >= 0 ? 'Activa' : 'Vencida';
  }

  public vigenciaLicencia(): string {
    const fecha = this.fechaVencimientoLicencia();
    return this.formatearFecha(fecha) ?? 'Sin vigencia activa';
  }

  public restanteLicencia(): string {
    const dias = this.diasRestantes();
    if (dias === null) return 'Sin licencia registrada';
    if (dias < 0) return 'Licencia vencida';
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Resta 1 dia';
    return `Restan ${dias} dias`;
  }

  public licenciaActiva(): boolean {
    const dias = this.diasRestantes();
    if (dias !== null) return dias >= 0;
    return this.estadoLicencia().toLowerCase() === 'activa';
  }

  private obtenerLicencia(): LicenciaColegio | null {
    return this.data?.licencia ?? this.data?.suscripcion ?? null;
  }

  private fechaVencimientoLicencia(): string | null | undefined {
    const licencia = this.obtenerLicencia();
    return (
      licencia?.fechaVencimiento
      ?? this.data?.fechaVencimientoLicencia
      ?? this.data?.fechaVencimientoSuscripcion
      ?? this.data?.licenciaFechaVencimiento
      ?? this.data?.fechaVencimientoPlan
      ?? null
    );
  }

  private diasRestantes(): number | null {
    const fecha = this.fechaVencimientoLicencia();
    if (!fecha?.trim()) return null;

    const vencimiento = new Date(fecha);
    if (Number.isNaN(vencimiento.getTime())) return null;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
    const inicioVencimiento = new Date(
      vencimiento.getFullYear(),
      vencimiento.getMonth(),
      vencimiento.getDate(),
    ).getTime();
    return Math.ceil((inicioVencimiento - inicioHoy) / 86_400_000);
  }

  private formatearFecha(fecha: string | null | undefined): string | null {
    if (!fecha?.trim()) return null;

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return null;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private normalizarEstado(estado: string): string {
    const normalizado = estado.toUpperCase();
    if (normalizado === 'ACTIVA' || normalizado === 'ACTIVE') return 'Activa';
    if (normalizado === 'PENDIENTE' || normalizado === 'PENDING') return 'Pendiente';
    if (normalizado === 'VENCIDA' || normalizado === 'EXPIRED') return 'Vencida';
    if (normalizado === 'CANCELADA' || normalizado === 'CANCELLED') return 'Cancelada';
    return estado;
  }
}
