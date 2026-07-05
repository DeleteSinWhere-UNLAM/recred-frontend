import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { SchoolOverview, Vendedor } from '../../models/directivo.model';

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

  public verDetalleVendedor(vendedor: Vendedor): void {
    this.vendedorSeleccionado.set(vendedor);
  }

  public cerrarModal(): void {
    this.vendedorSeleccionado.set(null);
  }
}
