import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { CompraService } from '../../../compra/services/compra.service';
import { ScheduledPickup, EstadoCompra } from '../../models/tracking-pedidos.model';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './order-details-modal.component.html',
  styleUrl: './order-details-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailsModalComponent {
  private readonly compraService = inject(CompraService);
  showVerificationModal = false;
  verificationCode = '';
  @Input({ required: true }) order!: ScheduledPickup;
  @Input() isUpdating = false;

  @Output() closeModal = new EventEmitter<void>();
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
      this.closeModal.emit();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
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
      this.showVerificationModal = true;
      return;
    }

    if (nextStatus) {
      this.advanceStatus.emit({ orderId: this.order.id, nextStatus });
    }
  }

  protected confirmDelivery(): void {
    if (!this.verificationCode) return;
    this.compraService.deliver(this.order.id, this.verificationCode).subscribe({
      next: () => {
        this.advanceStatus.emit({ orderId: this.order.id, nextStatus: 'ENTREGADO' });
        this.showVerificationModal = false;
        this.verificationCode = '';
      },
      error: () => {
        alert('Código incorrecto. Intente nuevamente.');
      }
    });
  }

protected onCancel(): void {
    if (this.isUpdating) return;
    if (confirm('¿Estás seguro de que deseas cancelar este pedido? Se le reembolsará el saldo al alumno.')) {
      this.cancelOrder.emit(this.order.id);
    }
  }
}
