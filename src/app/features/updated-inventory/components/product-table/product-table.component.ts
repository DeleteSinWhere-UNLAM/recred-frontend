import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import {
  InventoryOverviewItem,
  TipoManejoInventario,
} from '../../models/inventory.interface';
import {
  getAvailabilityRatio,
  getOperationalStockStatus,
  getReservationRatio,
  isHighReservation,
  OperationalStockStatus,
} from '../../models/inventory-visual-state';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CurrencyPipe, NgClass],
  templateUrl: './product-table.component.html',
  styleUrl: './product-table.component.css'
})
export class ProductTableComponent {
  @Input() products: InventoryOverviewItem[] = [];
  @Input() isLoading = false;
  @Input() highlightedProductIds: ReadonlySet<string> = new Set<string>();
  @Output() manageInventory = new EventEmitter<InventoryOverviewItem>();
  @Output() viewHistory = new EventEmitter<InventoryOverviewItem>();

  getModeLabel(mode: TipoManejoInventario): string {
    const labels: Record<TipoManejoInventario, string> = {
      STOCK_EXACTO: 'Stock exacto',
      DISPONIBLE_NO_DISPONIBLE: 'Disponible / No disponible',
      CUPO_DIARIO: 'Cupo diario',
    };

    return labels[mode];
  }

  getStatusLabel(product: InventoryOverviewItem): string {
    const labels: Record<OperationalStockStatus, string> = {
      AGOTADO: 'Agotado',
      BAJO_STOCK: 'Bajo stock',
      ALTA_RESERVA: 'Alta reserva',
      PAUSADO: 'No disponible',
      OK: 'OK',
    };

    return labels[this.getOperationalStatus(product)];
  }

  getOperationalStatus(product: InventoryOverviewItem): OperationalStockStatus {
    return getOperationalStockStatus(product);
  }

  getStatusIcon(product: InventoryOverviewItem): string {
    const icons: Record<OperationalStockStatus, string> = {
      AGOTADO: 'fa-ban',
      BAJO_STOCK: 'fa-triangle-exclamation',
      ALTA_RESERVA: 'fa-clock',
      PAUSADO: 'fa-pause',
      OK: 'fa-check',
    };

    return icons[this.getOperationalStatus(product)];
  }

  getStockValue(product: InventoryOverviewItem): string {
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

  getAvailabilityLabel(product: InventoryOverviewItem): string {
    return product.tipoManejoInventario === 'DISPONIBLE_NO_DISPONIBLE'
      ? 'Estado operativo'
      : 'Disponible';
  }

  getAvailabilityPercent(product: InventoryOverviewItem): number {
    return Math.round(getAvailabilityRatio(product) * 100);
  }

  getReservationPercent(product: InventoryOverviewItem): number {
    return Math.round(getReservationRatio(product) * 100);
  }

  getAvailabilityBase(product: InventoryOverviewItem): string {
    if (product.stockDisponible === null && product.stockReservado === null) {
      return '-';
    }

    const total =
      this.getNumericStock(product.stockDisponible) +
      this.getNumericStock(product.stockReservado);

    return total.toString();
  }

  isHighReservation(product: InventoryOverviewItem): boolean {
    return isHighReservation(product);
  }

  isHighlighted(product: InventoryOverviewItem): boolean {
    return this.highlightedProductIds.has(product.productId);
  }

  emitManageInventory(product: InventoryOverviewItem): void {
    this.manageInventory.emit(product);
  }

  emitViewHistory(product: InventoryOverviewItem): void {
    this.viewHistory.emit(product);
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
