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
      STOCK_EXACTO: 'Control por unidades',
      DISPONIBLE_NO_DISPONIBLE: 'Disponible / No disponible',
      CUPO_DIARIO: 'Límite diario de venta',
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
    if (product.tipoManejoInventario === 'DISPONIBLE_NO_DISPONIBLE') {
      return 'Estado operativo';
    }

    if (product.tipoManejoInventario === 'CUPO_DIARIO') {
      return 'Disponible hoy';
    }

    return 'Disponible';
  }

  getAvailabilityPercent(product: ItemResumenInventario): number {
    if (product.tipoManejoInventario === 'CUPO_DIARIO') {
      return this.getDailyQuotaPercent(product);
    }

    return Math.round(obtenerRatioDisponibilidad(product) * 100);
  }

  getAvailabilityBarLabel(product: ItemResumenInventario): string {
    return `${this.getAvailabilityLabel(product)} ${this.getAvailabilityPercent(product)}%`;
  }

  getReservationPercent(product: ItemResumenInventario): number {
    return Math.round(obtenerRatioReserva(product) * 100);
  }

  getAvailabilitySecondaryStartLabel(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO'
      ? 'Usado hoy'
      : 'Reservado';
  }

  getAvailabilitySecondaryStartValue(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO'
      ? this.formatNullable(this.getDailyQuotaUsed(product))
      : this.formatNullable(product.stockReservado);
  }

  getAvailabilitySecondaryEndLabel(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO' ? 'Límite' : 'Total';
  }

  getAvailabilitySecondaryEndValue(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO'
      ? this.formatNullable(product.cupoMaximoDiario)
      : this.getAvailabilityBase(product);
  }

  getPrimaryStockMetricLabel(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO'
      ? 'Stock físico'
      : 'Stock actual';
  }

  getSecondaryStockMetricLabel(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO'
      ? 'Reservado'
      : 'Alerta en';
  }

  getSecondaryStockMetricValue(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO'
      ? this.formatNullable(product.stockReservado)
      : this.formatNullable(product.stockMinimo);
  }

  getTertiaryStockMetricLabel(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO'
      ? 'Alerta en'
      : 'Reserva';
  }

  getTertiaryStockMetricValue(product: ItemResumenInventario): string {
    return product.tipoManejoInventario === 'CUPO_DIARIO'
      ? this.formatNullable(product.stockMinimo)
      : `${this.getReservationPercent(product)}%`;
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

  private getDailyQuotaPercent(product: ItemResumenInventario): number {
    const max = this.getNumericStock(product.cupoMaximoDiario);

    if (max <= 0) {
      return 0;
    }

    const available = Math.min(this.getNumericStock(product.cupoDisponibleDia), max);

    return Math.round((available / max) * 100);
  }

  private getDailyQuotaUsed(product: ItemResumenInventario): number | null {
    if (
      product.cupoMaximoDiario === null ||
      product.cupoDisponibleDia === null ||
      !Number.isFinite(product.cupoMaximoDiario) ||
      !Number.isFinite(product.cupoDisponibleDia)
    ) {
      return null;
    }

    const max = Math.max(product.cupoMaximoDiario, 0);
    const available = Math.min(Math.max(product.cupoDisponibleDia, 0), max);

    return max - available;
  }
}

const IMAGEN_FALLBACK =
  'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
