import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { CompraService } from '../../../compra/services/compra.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ScheduledPickup, EstadoCompra } from '../../models/tracking-pedidos.model';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionService, Promotion } from '../../../../data-access/services/promociones/promotion.service';
import { ProductoService } from '../../../../features/inventario/services/producto.service';
import { Producto } from '../../../../features/inventario/models/producto.interface';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  private readonly promotionService = inject(PromotionService);
  private readonly productService = inject(ProductoService);
  private readonly dialogService = inject(DialogService);

  promosLoaded = new Map<string, { promotion: Promotion | null; products: Producto[]; loading: boolean; error: boolean }>();
  expandedPromos = new Set<string>();

  esPromocion(nombre: string): boolean {
    if (!nombre) return false;
    const nameLower = nombre.toLowerCase();
    return nameLower.startsWith('promo') || nameLower.startsWith('combo') || nameLower.includes('duo pack');
  }

  togglePromoDetails(productId: string): void {
    if (this.expandedPromos.has(productId)) {
      this.expandedPromos.delete(productId);
      return;
    }

    this.expandedPromos.add(productId);

    if (this.promosLoaded.has(productId)) {
      return;
    }

    this.promosLoaded.set(productId, { promotion: null, products: [], loading: true, error: false });

    this.promotionService.getPromotionById(productId).subscribe({
      next: (promo) => {
        const productRequests = (promo.productIds || []).map((id) =>
          this.productService.getById(id).pipe(
            catchError(() => of(null))
          )
        );

        if (productRequests.length === 0) {
          this.promosLoaded.set(productId, {
            promotion: promo,
            products: [],
            loading: false,
            error: false,
          });
          return;
        }

        forkJoin(productRequests).subscribe({
          next: (products) => {
            const validProducts = products.filter((p) => !!p);
            this.promosLoaded.set(productId, {
              promotion: promo,
              products: validProducts,
              loading: false,
              error: false,
            });
          },
          error: () => {
            this.promosLoaded.set(productId, {
              promotion: promo,
              products: [],
              loading: false,
              error: true,
            });
          }
        });
      },
      error: () => {
        this.promosLoaded.set(productId, {
          promotion: null,
          products: [],
          loading: false,
          error: true,
        });
      }
    });
  }

  getPromoOriginalPrice(productId: string): number {
    const data = this.promosLoaded.get(productId);
    if (!data || !data.products) return 0;
    return data.products.reduce((acc, p) => acc + (p.precio || 0), 0);
  }

  getPromoDiscountedPrice(productId: string): number {
    const data = this.promosLoaded.get(productId);
    if (!data || !data.promotion) return 0;
    const original = this.getPromoOriginalPrice(productId);
    const discount = data.promotion.discountPercentage || 0;
    return Math.round(original * (1 - discount / 100));
  }

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
      error: async () => {
        await this.dialogService.alert('Código incorrecto. Intente nuevamente.', 'Código Inválido');
      }
    });
  }

  protected async onCancel(): Promise<void> {
    if (this.isUpdating) return;
    const confirmacion = await this.dialogService.confirm('¿Estás seguro de que deseas cancelar este pedido? Se le reembolsará el saldo al alumno.', 'Cancelar Pedido');
    if (confirmacion) {
      this.cancelOrder.emit(this.order.id);
    }
  }
}
