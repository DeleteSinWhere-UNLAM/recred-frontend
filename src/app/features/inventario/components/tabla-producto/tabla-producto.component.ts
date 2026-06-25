import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import {
  ItemResumenInventario,
  TipoManejoInventario,
} from '../../models/inventario.interface';
import {
  obtenerRatioDisponibilidad,
  getEstadoOperativoStock,
  obtenerRatioReserva,
  esAltaReserva,
  EstadoOperativoStock,
} from '../../models/estado-visual-inventario';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CurrencyPipe, NgClass],
  templateUrl: './tabla-producto.component.html',
  styleUrl: './tabla-producto.component.css'
})
export class TablaProductoComponent {
  @Input() products: ItemResumenInventario[] = [];
  @Input() isLoading = false;
  @Input() highlightedProductIds: ReadonlySet<string> = new Set<string>();
  @Output() manageInventory = new EventEmitter<ItemResumenInventario>();
  @Output() viewHistory = new EventEmitter<ItemResumenInventario>();
  @Output() editProduct = new EventEmitter<ItemResumenInventario>();
  @Output() deleteProduct = new EventEmitter<ItemResumenInventario>();

  protected readonly IMAGEN_FALLBACK = IMAGEN_FALLBACK;

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === IMAGEN_FALLBACK) return;
    img.src = IMAGEN_FALLBACK;
  }

  getModeLabel(mode: TipoManejoInventario): string {
    const labels: Record<TipoManejoInventario, string> = {
      STOCK_EXACTO: 'Stock exacto',
      DISPONIBLE_NO_DISPONIBLE: 'Disponible / No disponible',
      CUPO_DIARIO: 'Cupo diario',
    };

    return labels[mode];
  }

  getStatusLabel(product: ItemResumenInventario): string {
    const labels: Record<EstadoOperativoStock, string> = {
      AGOTADO: 'Agotado',
      BAJO_STOCK: 'Bajo stock',
      ALTA_RESERVA: 'Alta reserva',
      PAUSADO: 'No disponible',
      OK: 'OK',
    };

    return labels[this.getOperationalStatus(product)];
  }

  getOperationalStatus(product: ItemResumenInventario): EstadoOperativoStock {
    return getEstadoOperativoStock(product);
  }

  getStatusIcon(product: ItemResumenInventario): string {
    const icons: Record<EstadoOperativoStock, string> = {
      AGOTADO: 'fa-ban',
      BAJO_STOCK: 'fa-triangle-exclamation',
      ALTA_RESERVA: 'fa-clock',
      PAUSADO: 'fa-pause',
      OK: 'fa-check',
    };

    return icons[this.getOperationalStatus(product)];
  }

  getStockValue(product: ItemResumenInventario): string {
    if (product.tipoManejoInventario === 'CUPO_DIARIO') {
      return this.formatNullable(product.cupoDisponibleDia);
    }

    if (product.tipoManejoInventario === 'DISPONIBLE_NO_DISPONIBLE') {
      return product.disponible &&
        !product.agotado &&
        product.estadoInventario !== 'DESACTIVADO'
        ? 'Disponible'
        : 'No disponible';
    }

    return this.formatNullable(product.stockDisponible);
  }

  getAvailabilityLabel(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'DISPONIBLE_NO_DISPONIBLE'
      ? 'Estado operativo'
      : 'Disponible';
  }

  getAvailabilityPercent(product: ItemResumenInventario): number {
    return Math.round(obtenerRatioDisponibilidad(product) * 100);
  }

  getReservationPercent(product: ItemResumenInventario): number {
    return Math.round(obtenerRatioReserva(product) * 100);
  }

  getAvailabilityBase(product: ItemResumenInventario): string {
    if (product.stockDisponible === null && product.stockReservado === null) {
      return '-';
    }

    const total =
      this.getNumericStock(product.stockDisponible) +
      this.getNumericStock(product.stockReservado);

    return total.toString();
  }

  isHighReservation(product: ItemResumenInventario): boolean {
    return esAltaReserva(product);
  }

  isHighlighted(product: ItemResumenInventario): boolean {
    return this.highlightedProductIds.has(product.productId);
  }

  emitManageInventory(product: ItemResumenInventario): void {
    this.manageInventory.emit(product);
  }

  emitViewHistory(product: ItemResumenInventario): void {
    this.viewHistory.emit(product);
  }

  emitEditProduct(product: ItemResumenInventario): void {
    this.editProduct.emit(product);
  }

  emitDeleteProduct(product: ItemResumenInventario): void {
    this.deleteProduct.emit(product);
  }

  formatNullable(value: number | null): string {
    return value === null ? '-' : value.toString();
  }

  private getNumericStock(value: number | null | undefined): number {
    return value !== null && value !== undefined && Number.isFinite(value) && value > 0
      ? value
      : 0;
  }
}

const IMAGEN_FALLBACK =
  'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
