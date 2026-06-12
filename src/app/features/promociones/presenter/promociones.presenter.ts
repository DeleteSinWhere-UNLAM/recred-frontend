import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { PromotionService, Promotion } from '../../../data-access/services/promociones/promotion.service';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

@Injectable()
export class PromocionesPagePresenter {
  private readonly promotionService = inject(PromotionService);
  private readonly router = inject(Router);

  private readonly promotionsState = signal<Promotion[]>([]);
  private readonly isLoadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);

  readonly promotions: Signal<Promotion[]> = this.promotionsState.asReadonly();
  readonly isLoading: Signal<boolean> = this.isLoadingState.asReadonly();
  readonly error: Signal<string | null> = this.errorState.asReadonly();

  readonly hasPromotions = computed(() => this.promotionsState().length > 0);

  loadPromotions(): void {
    this.isLoadingState.set(true);
    this.errorState.set(null);

    this.promotionService.getPromotions().pipe(
      catchError(() => {
        this.errorState.set('Ocurrió un error al cargar las promociones. Por favor, intenta nuevamente.');
        return of([]);
      }),
      finalize(() => {
        this.isLoadingState.set(false);
      })
    ).subscribe({
      next: (data) => {
        const normalizedData = data.map((item: Promotion) => {
          const promoRaw = item as unknown as Record<string, unknown>;
          return {
            id: (promoRaw['id'] as string) || '',
            name: (promoRaw['name'] || promoRaw['nombre'] || promoRaw['titulo'] || 'Sin nombre') as string,
            discountPercentage: (promoRaw['discountPercentage'] || promoRaw['porcentajeDescuento'] || promoRaw['porcentaje_descuento'] || 0) as number,
            productIds: (promoRaw['productIds'] || promoRaw['productosIds'] || promoRaw['productos'] || promoRaw['product_ids'] || []) as string[],
            startDate: this.sanitizeDate((promoRaw['startDate'] || promoRaw['start_date'] || promoRaw['fechaInicio'] || promoRaw['fecha_inicio'] || new Date().toISOString()) as string),
            endDate: this.sanitizeDate((promoRaw['endDate'] || promoRaw['end_date'] || promoRaw['fechaFin'] || promoRaw['fecha_fin'] || new Date().toISOString()) as string),
            status: (promoRaw['status'] || promoRaw['estado'] || 'UNKNOWN') as string
          };
        });

        this.promotionsState.set(normalizedData);
      }
    });
  }

  private sanitizeDate(d: string): string {
    if (!d) return '';
    return d.split('.')[0] + 'Z';
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  deletePromotion(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
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
