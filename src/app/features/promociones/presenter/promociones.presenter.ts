import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { PromotionService, Promotion } from '../../../data-access/services/promociones/promotion.service';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { DialogService } from '../../../shared/services/dialog.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { Producto } from '../../inventario/models/producto.interface';

export interface PromotionWithProducts extends Promotion {
  products: Producto[];
}

@Injectable()
export class PromocionesPagePresenter {
  private readonly promotionService = inject(PromotionService);
  private readonly productService = inject(ProductoService);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);

  private readonly promotionsState = signal<PromotionWithProducts[]>([]);
  private readonly filterState = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  private readonly sortState = signal<'DATE_DESC' | 'NAME_ASC' | 'NAME_DESC'>('DATE_DESC');
  private readonly isLoadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);

  readonly promotions: Signal<PromotionWithProducts[]> = this.promotionsState.asReadonly();
  readonly filter: Signal<'ALL' | 'ACTIVE' | 'INACTIVE'> = this.filterState.asReadonly();
  readonly sort: Signal<'DATE_DESC' | 'NAME_ASC' | 'NAME_DESC'> = this.sortState.asReadonly();
  readonly isLoading: Signal<boolean> = this.isLoadingState.asReadonly();
  readonly error: Signal<string | null> = this.errorState.asReadonly();

  readonly hasPromotions = computed(() => this.promotionsState().length > 0);
  readonly filteredPromotions = computed(() => {
    const filter = this.filterState();
    const sort = this.sortState();
    const all = this.promotionsState();

    let result = all;
    if (filter === 'ACTIVE') result = all.filter(p => p.status === 'ACTIVE');
    else if (filter === 'INACTIVE') result = all.filter(p => p.status === 'INACTIVE');

    return result.slice().sort((a, b) => {
      if (sort === 'NAME_ASC') return a.name.localeCompare(b.name);
      if (sort === 'NAME_DESC') return b.name.localeCompare(a.name);
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  });

  getStatusLabel(promotion: PromotionWithProducts): string {
    if (promotion.status === 'INACTIVE') {
      return 'Inactiva';
    }

    const now = new Date().getTime();
    const start = new Date(promotion.startDate).getTime();
    const end = new Date(promotion.endDate).getTime();

    if (now < start) return 'Programada';
    if (now > end) return 'Vencida';
    return 'Activa';
  }

  getPromotionStateClass(promotion: PromotionWithProducts): string {
    if (promotion.status === 'INACTIVE') return 'inactive';

    const now = new Date().getTime();
    const start = new Date(promotion.startDate).getTime();
    const end = new Date(promotion.endDate).getTime();

    if (now < start) return 'draft';
    if (now > end) return 'expired';
    return 'active';
  }

  getOriginalTotal(promotion: PromotionWithProducts): number {
    return promotion.products.reduce((total, product) => total + (product.precio || 0), 0);
  }

  getDiscountedTotal(promotion: PromotionWithProducts): number {
    const originalTotal = this.getOriginalTotal(promotion);
    return Math.round(originalTotal * (1 - (promotion.discountPercentage || 0) / 100));
  }

  getVisibleProducts(promotion: PromotionWithProducts): Producto[] {
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
      status: (promoRaw['status'] || promoRaw['estado'] || 'UNKNOWN') as string,
      imageUrl: (promoRaw['imageUrl'] || promoRaw['image_url'] || promoRaw['imagenUrl'] || promoRaw['imagen']) as string | undefined
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

  private resolveProducts(productIds: string[]): Observable<Producto[]> {
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
          } as Producto))
        )
      )
    );
  }

  private sanitizeDate(d: string): string {
    if (!d) return '';
    return d.split('.')[0] + 'Z';
  }

  nuevaPromocion(): void {
    this.router.navigateByUrl('/kiosquero/sugerencias');
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  setFilter(filter: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.filterState.set(filter);
  }

  setSort(sort: 'DATE_DESC' | 'NAME_ASC' | 'NAME_DESC'): void {
    this.sortState.set(sort);
  }

  toggleStatus(id: string): void {
    this.isLoadingState.set(true);
    this.promotionService.cambiarEstadoPromocion(id).pipe(
      finalize(() => this.isLoadingState.set(false))
    ).subscribe({
      next: () => this.loadPromotions(),
      error: () => this.errorState.set('Error al cambiar el estado de la promoción.')
    });
  }

  savePromotion(promo: Partial<PromotionWithProducts>): void {
    this.isLoadingState.set(true);
    this.promotionService.actualizarPromocion(promo.id!, promo).pipe(
      finalize(() => this.isLoadingState.set(false))
    ).subscribe({
      next: () => this.loadPromotions(),
      error: () => this.errorState.set('Error al actualizar la promoción.')
    });
  }


  isExpiringSoon(promotion: PromotionWithProducts): boolean {
    if (promotion.status !== 'ACTIVE') return false;
    const endDate = new Date(promotion.endDate).getTime();
    const now = new Date().getTime();
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    return endDate - now > 0 && endDate - now <= threeDaysInMs;
  }
}
