import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ScheduledPickup, EstadoCompra } from '../../models/tracking-pedidos.model';

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './order-details-modal.component.html',
  styleUrl: './order-details-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailsModalComponent {
  @Input({ required: true }) order!: ScheduledPickup;
  @Input() isUpdating = false;

  @Output() close = new EventEmitter<void>();
  @Output() advanceStatus = new EventEmitter<{ orderId: string; nextStatus: EstadoCompra }>();
  @Output() cancelOrder = new EventEmitter<string>();

  readonly nextStatusText = computed(() => {
    switch (this.order.status) {
      case 'PENDIENTE':
        return 'Iniciar preparación';
      case 'EN_PREPARACION':
        return 'Marcar como listo';
      case 'LISTO':
        return 'Entregar pedido';
      default:
        return '';
    }
  });

  readonly canAdvance = computed(() => {
    return ['PENDIENTE', 'EN_PREPARACION', 'LISTO'].includes(this.order.status);
  });

  readonly canCancel = computed(() => {
    return ['PENDIENTE', 'EN_PREPARACION', 'LISTO'].includes(this.order.status);
  });

  protected onClose(): void {
    if (!this.isUpdating) {
      this.close.emit();
    }
  }

  protected onAdvance(): void {
    if (this.isUpdating) return;

    let nextStatus: EstadoCompra | null = null;
    if (this.order.status === 'PENDIENTE') {
      nextStatus = 'EN_PREPARACION';
    } else if (this.order.status === 'EN_PREPARACION') {
      nextStatus = 'LISTO';
    } else if (this.order.status === 'LISTO') {
      nextStatus = 'ENTREGADO';
    }

    if (nextStatus) {
      this.advanceStatus.emit({ orderId: this.order.id, nextStatus });
    }
  }

  protected onCancel(): void {
    if (this.isUpdating) return;
    if (confirm('¿Estás seguro de que deseas cancelar este pedido? Se le reembolsará el saldo al alumno.')) {
      this.cancelOrder.emit(this.order.id);
    }
  }
}
