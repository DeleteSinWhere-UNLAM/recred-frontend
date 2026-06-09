import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import {
  InventoryOverviewItem,
  QuickStockAction,
  TipoManejoInventario,
} from '../../models/inventory.interface';

export interface QuickStockActionSelection {
  product: InventoryOverviewItem;
  action: QuickStockAction;
}

interface QuickActionButton {
  action: QuickStockAction;
  label: string;
  icon: string;
  tone: 'primary' | 'neutral' | 'warning' | 'danger';
}

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
  @Output() quickAction = new EventEmitter<QuickStockActionSelection>();

  getModeLabel(mode: TipoManejoInventario): string {
    const labels: Record<TipoManejoInventario, string> = {
      STOCK_EXACTO: 'Stock exacto',
      DISPONIBLE_NO_DISPONIBLE: 'Disponible',
      CUPO_DIARIO: 'Cupo diario',
    };

    return labels[mode];
  }

  getStatusLabel(product: InventoryOverviewItem): string {
    const labels = {
      DISPONIBLE: 'Disponible',
      BAJO_STOCK: 'Bajo stock',
      SIN_STOCK: 'Agotado',
      DESACTIVADO: 'Pausado',
    };

    return labels[product.estadoInventario];
  }

  getStockValue(product: InventoryOverviewItem): string {
    if (product.tipoManejoInventario === 'CUPO_DIARIO') {
      return this.formatNullable(product.cupoDisponibleDia);
    }

    if (product.tipoManejoInventario === 'DISPONIBLE_NO_DISPONIBLE') {
      return product.disponible && !product.agotado ? 'Disponible' : 'No disponible';
    }

    return this.formatNullable(product.stockDisponible);
  }

  getActions(product: InventoryOverviewItem): QuickActionButton[] {
    if (product.tipoManejoInventario === 'DISPONIBLE_NO_DISPONIBLE') {
      return product.disponible
        ? [
            {
              action: 'SET_UNAVAILABLE',
              label: 'Pausar',
              icon: 'fa-pause',
              tone: 'warning',
            },
          ]
        : [
            {
              action: 'SET_AVAILABLE',
              label: 'Activar',
              icon: 'fa-play',
              tone: 'primary',
            },
          ];
    }

    if (product.tipoManejoInventario === 'CUPO_DIARIO') {
      return [
        {
          action: 'SET_DAILY_CAPACITY',
          label: 'Cupo',
          icon: 'fa-calendar-day',
          tone: 'primary',
        },
        {
          action: 'ADD_STOCK',
          label: '+ Cupo',
          icon: 'fa-plus',
          tone: 'neutral',
        },
        {
          action: 'MARK_SOLD_OUT',
          label: 'Agotar',
          icon: 'fa-ban',
          tone: 'danger',
        },
      ];
    }

    return [
      {
        action: 'ADD_STOCK',
        label: '+ Stock',
        icon: 'fa-plus',
        tone: 'primary',
      },
      {
        action: 'SUBTRACT_STOCK',
        label: '- Stock',
        icon: 'fa-minus',
        tone: 'neutral',
      },
      {
        action: 'SET_STOCK',
        label: 'Definir',
        icon: 'fa-pen-to-square',
        tone: 'warning',
      },
      {
        action: 'MARK_SOLD_OUT',
        label: 'Agotar',
        icon: 'fa-ban',
        tone: 'danger',
      },
    ];
  }

  emitAction(product: InventoryOverviewItem, action: QuickStockAction): void {
    this.quickAction.emit({ product, action });
  }

  formatNullable(value: number | null): string {
    return value === null ? '-' : value.toString();
  }
}
