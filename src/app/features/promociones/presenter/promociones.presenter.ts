import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { PromotionService, Promotion } from '../../../data-access/services/promociones/promotion.service';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { DialogService } from '../../../shared/services/dialog.service';
import { ProductService } from '../../updated-inventory/services/product.service';
import { Product } from '../../updated-inventory/models/product.interface';

export interface PromotionWithProducts extends Promotion {
  products: Product[];
}

@Injectable()
export class PromocionesPagePresenter {
  private readonly promotionService = inject(PromotionService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);

  private readonly promotionsState = signal<PromotionWithProducts[]>([]);
  private readonly isLoadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);

  readonly promotions: Signal<PromotionWithProducts[]> = this.promotionsState.asReadonly();
  readonly isLoading: Signal<boolean> = this.isLoadingState.asReadonly();
  readonly error: Signal<string | null> = this.errorState.asReadonly();

  readonly hasPromotions = computed(() => this.promotionsState().length > 0);

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activa',
      REJECTED: 'Rechazada',
      EXPIRED: 'Vencida',
    };

    return labels[status] ?? status;
  }

  getOriginalTotal(promotion: PromotionWithProducts): number {
    return promotion.products.reduce((total, product) => total + (product.precio || 0), 0);
  }

  getDiscountedTotal(promotion: PromotionWithProducts): number {
    const originalTotal = this.getOriginalTotal(promotion);
    return Math.round(originalTotal * (1 - (promotion.discountPercentage || 0) / 100));
  }

  getVisibleProducts(promotion: PromotionWithProducts): Product[] {
    return promotion.products.slice(0, 3);
  }

  getHiddenProductsCount(promotion: PromotionWithProducts): number {
    return Math.max(promotion.products.length - 3, 0);
  }

  loadPromotions(): void {
    this.isLoadingState.set(true);
    this.errorState.set(null);

    this.promotionService.getPromotions().pipe(
      map((data) => data.map((item: Promotion) => this.normalizePromotion(item))),
      switchMap((promotions) => this.resolvePromotionsProducts(promotions)),
      catchError(() => {
        this.errorState.set('Ocurrió un error al cargar las promociones. Por favor, intenta nuevamente.');
        return of([]);
      }),
      finalize(() => {
        this.isLoadingState.set(false);
      })
    ).subscribe({
      next: (data) => {
        this.promotionsState.set(data);
      }
    });
  }

  private normalizePromotion(item: Promotion): Promotion {
    const promoRaw = item as unknown as Record<string, unknown>;
    return {
      id: (promoRaw['id'] as string) || '',
      name: (promoRaw['name'] || promoRaw['nombre'] || promoRaw['titulo'] || 'Sin nombre') as string,
      discountPercentage: (promoRaw['discountPercentage'] || promoRaw['porcentajeDescuento'] || promoRaw['porcentaje_descuento'] || 0) as number,
      productIds: this.normalizeProductIds(promoRaw),
      startDate: this.sanitizeDate((promoRaw['startDate'] || promoRaw['start_date'] || promoRaw['fechaInicio'] || promoRaw['fecha_inicio'] || new Date().toISOString()) as string),
      endDate: this.sanitizeDate((promoRaw['endDate'] || promoRaw['end_date'] || promoRaw['fechaFin'] || promoRaw['fecha_fin'] || new Date().toISOString()) as string),
      status: (promoRaw['status'] || promoRaw['estado'] || 'UNKNOWN') as string
    };
  }

  private normalizeProductIds(promoRaw: Record<string, unknown>): string[] {
    const rawProducts = (promoRaw['productIds'] || promoRaw['productosIds'] || promoRaw['productos'] || promoRaw['product_ids'] || []) as unknown[];

    return rawProducts
      .map((product) => {
        if (typeof product === 'string') return product;
        if (product && typeof product === 'object') {
          const productRaw = product as Record<string, unknown>;
          return (productRaw['id'] || productRaw['productId'] || productRaw['productoId']) as string | undefined;
        }
        return undefined;
      })
      .filter((id): id is string => !!id);
  }

  private resolvePromotionsProducts(promotions: Promotion[]): Observable<PromotionWithProducts[]> {
    if (promotions.length === 0) return of([]);

    return forkJoin(
      promotions.map((promotion) => this.resolveProducts(promotion.productIds).pipe(
        map((products) => ({ ...promotion, products }))
      ))
    );
  }

  private resolveProducts(productIds: string[]): Observable<Product[]> {
    if (!productIds || productIds.length === 0) return of([]);

    return forkJoin(
      productIds.map((id) =>
        this.productService.getById(id).pipe(
          catchError(() => of({
            id,
            nombre: 'Producto no disponible',
            descripcion: '',
            precio: 0,
            peso: 0,
            requierePreparacion: false,
            stockActual: 0,
          } as Product))
        )
      )
    );
  }

  private sanitizeDate(d: string): string {
    if (!d) return '';
    return d.split('.')[0] + 'Z';
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  async deletePromotion(id: string): Promise<void> {
    const confirmed = await this.dialogService.confirm('¿Estás seguro de que deseas eliminar esta promoción?', 'Eliminar Promoción');
    if (confirmed) {
      this.isLoadingState.set(true);
      this.promotionService.discardPromotion(id).pipe(
        catchError(() => {
          this.errorState.set('Error al eliminar la promoción.');
          return of(null);
        }),
        finalize(() => this.isLoadingState.set(false))
      ).subscribe({
        next: (success) => {
          if (success !== null) {
            this.loadPromotions();
          }
        }
      });
    }
  }
}
