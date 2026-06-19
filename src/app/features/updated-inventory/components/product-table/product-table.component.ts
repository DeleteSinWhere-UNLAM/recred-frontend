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
  @Output() editProduct = new EventEmitter<InventoryOverviewItem>();
  @Output() deleteProduct = new EventEmitter<InventoryOverviewItem>();

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

  emitEditProduct(product: InventoryOverviewItem): void {
    this.editProduct.emit(product);
  }

  emitDeleteProduct(product: InventoryOverviewItem): void {
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
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 140'>
      <rect width='200' height='140' fill='#E8EDF3'/>
      <g fill='#94A3B8' transform='translate(72 38)'>
        <path d='M28 8c-11 0-20 9-20 20s9 20 20 20 20-9 20-20S39 8 28 8zm0 6a14 14 0 110 28 14 14 0 010-28z'/>
      </g>
      <text x='100' y='110' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='600' fill='#94A3B8'>Sin imagen</text>
    </svg>`,
  );
