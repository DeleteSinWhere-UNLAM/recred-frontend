import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Buffet, SchoolOverview, Vendedor } from '../../models/directivo.model';

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

  public vendedorSeleccionado = signal<Vendedor | null>(null);
  public buffetSeleccionado = signal<Buffet | null>(null);

  @Output() reenviarCredencialesRequested = new EventEmitter<string>();

  public emitirReenviarCredenciales(): void {
    const vendedor = this.vendedorSeleccionado();
    if (vendedor) {
      this.reenviarCredencialesRequested.emit(vendedor.id);
    }
  }

  public verDetalleVendedor(vendedor: Vendedor, buffet: Buffet): void {
    this.vendedorSeleccionado.set(vendedor);
    this.buffetSeleccionado.set(buffet);
  }

  public cerrarModal(): void {
    this.vendedorSeleccionado.set(null);
    this.buffetSeleccionado.set(null);
  }

  public buffetsConVendedor(): number {
    return this.data?.buffets.filter((buffet) => !!buffet.vendedor).length ?? 0;
  }

  public buffetsSinVendedor(): number {
    return this.data?.buffets.filter((buffet) => !buffet.vendedor).length ?? 0;
  }
}
