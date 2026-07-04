import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';

import { TrackingPedidosService } from '../../../tracking-pedidos/services/tracking-pedidos.service';
import { CompraService } from '../../../compra/services/compra.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ScheduledPickup, EstadoCompra } from '../../../tracking-pedidos/models/tracking-pedidos.model';

type ModalState = 'BUSCAR' | 'CHECKLIST' | 'EXITO';

@Component({
  selector: 'app-modal-verificacion-codigo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-verificacion-codigo.component.html',
  styleUrl: './modal-verificacion-codigo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalVerificacionCodigoComponent {
  private readonly trackingService = inject(TrackingPedidosService);
  private readonly compraService = inject(CompraService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Output() closeModal = new EventEmitter<void>();
  @Output() orderDelivered = new EventEmitter<void>();

  currentState: ModalState = 'BUSCAR';
  searchCode = '';
  order: ScheduledPickup | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  onCancel(): void {
    if (!this.isSubmitting) {
      this.closeModal.emit();
    }
  }

  onSearch(): void {
    const cleanedCode = this.searchCode.trim();
    if (!cleanedCode) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.order = null;

    this.trackingService.getScheduledPickups({ search: cleanedCode }).subscribe({
      next: (results) => {
        this.isLoading = false;

        const found = results.find(
          (r) => r.withdrawalCode && r.withdrawalCode.toUpperCase() === cleanedCode.toUpperCase()
        );

        if (!found) {
          this.errorMessage = 'No se encontró ningún pedido con ese código de retiro. Verifique e intente nuevamente.';
          this.cdr.markForCheck();
          return;
        }

        if (found.status === 'ENTREGADO') {
          this.errorMessage = `Este pedido ya fue entregado a ${found.studentName}.`;
        } else if (found.status === 'CANCELADO' || found.status === 'RECHAZADO' || found.status === 'VENCIDO') {
          this.errorMessage = `El pedido se encuentra ${this.getStatusLabel(found.status).toLowerCase()} y no puede ser entregado.`;
        } else {
          this.order = found;
          this.currentState = 'CHECKLIST';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error searching pickup by code:', err);
        this.isLoading = false;
        this.errorMessage = 'Ocurrió un error al buscar el código. Por favor, reintente.';
        this.cdr.markForCheck();
      }
    });
  }

  onConfirmDelivery(): void {
    if (!this.order || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.compraService.deliver(this.order.id, this.order.withdrawalCode)
      .pipe(
        switchMap(() => this.trackingService.advanceOrderStatus(this.order!.id, 'ENTREGADO'))
      )
      .subscribe({
        next: () => {
          this.currentState = 'EXITO';
          this.isSubmitting = false;
          this.orderDelivered.emit();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error confirming delivery:', err);
          this.isSubmitting = false;
          this.errorMessage = 'Error al validar el código o actualizar el estado del pedido. Intente nuevamente.';
          this.cdr.markForCheck();
        }
      });
  }

  resetModal(): void {
    this.currentState = 'BUSCAR';
    this.searchCode = '';
    this.order = null;
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  private getStatusLabel(status: EstadoCompra): string {
    const labels: Record<EstadoCompra, string> = {
      PENDIENTE: 'A preparar',
      EN_PREPARACION: 'En preparación',
      LISTO: 'Listo para retirar',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
      RECHAZADO: 'Rechazado',
      VENCIDO: 'Vencido',
    };
    return labels[status] || status;
  }
}
