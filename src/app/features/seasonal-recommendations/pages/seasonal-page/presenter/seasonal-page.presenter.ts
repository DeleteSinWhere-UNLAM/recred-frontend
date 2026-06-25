import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, of, switchMap, forkJoin } from 'rxjs';
import { RecomendacionesService } from '../../../services/recomendaciones.service';
import { ProductService } from '../../../../updated-inventory/services/product.service';
import { PromotionService } from '../../../../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { PerfilService } from '../../../../../data-access/services/perfil.service';
import { Sugerencia, PromocionSugerida, SeasonInfo, WeatherInfo } from '../../../models/recomendacion.model';
import { Product } from '../../../../updated-inventory/models/product.interface';

@Injectable()
export class SeasonalPagePresenter {
  private readonly recomendacionesService = inject(RecomendacionesService);
  private readonly productService = inject(ProductService);
  private readonly promotionService = inject(PromotionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly perfilService = inject(PerfilService);

  private readonly isLoadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  private readonly sugerenciasState = signal<Sugerencia[]>([]);
  private readonly tipPromocionalState = signal<string | null>(null);


  private readonly suggestedPromotionState = signal<PromocionSugerida | null>(null);
  private readonly seasonInfoState = signal<SeasonInfo | null>(null);
  private readonly weatherInfoState = signal<WeatherInfo | null>(null);
  private readonly resolvedProductsState = signal<Product[]>([]);
  private readonly showModalState = signal<boolean>(false);

  readonly isLoading: Signal<boolean> = this.isLoadingState.asReadonly();
  readonly error: Signal<string | null> = this.errorState.asReadonly();
  readonly sugerencias: Signal<Sugerencia[]> = this.sugerenciasState.asReadonly();
  readonly tipPromocional: Signal<string | null> = this.tipPromocionalState.asReadonly();

  readonly suggestedPromotion: Signal<PromocionSugerida | null> = this.suggestedPromotionState.asReadonly();
  readonly seasonInfo: Signal<SeasonInfo | null> = this.seasonInfoState.asReadonly();
  readonly weatherInfo: Signal<WeatherInfo | null> = this.weatherInfoState.asReadonly();
  readonly resolvedProducts: Signal<Product[]> = this.resolvedProductsState.asReadonly();
  readonly showModal: Signal<boolean> = this.showModalState.asReadonly();

  readonly shouldShowPromotionModal = computed(() => {
    return this.showModalState() && this.suggestedPromotionState() !== null;
  });

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  loadRecommendations(): void {
    this.isLoadingState.set(true);
    this.errorState.set(null);

    this.getCurrentPosition().pipe(
      switchMap(position => {
        return this.recomendacionesService.getSeasonalRecommendations(
          position.coords.latitude,
          position.coords.longitude
        );
      }),
      switchMap(response => {
        if (!response) return of(null);

        this.sugerenciasState.set(response.sugerencias || []);
        this.tipPromocionalState.set(response.tip_promocional || null);
        this.seasonInfoState.set(response.info_estacion || null);
        this.weatherInfoState.set(response.clima_actual || null);
        this.suggestedPromotionState.set(response.promocion_sugerida || null);

        if (response.promocion_sugerida && response.promocion_sugerida.productIds) {
          return this.resolveProducts(response.promocion_sugerida.productIds);
        }
        return of([]);
      }),
      catchError(err => {
        if (err instanceof GeolocationPositionError) {
          this.errorState.set('No pudimos acceder a tu ubicación. Por favor, permite el acceso para ver recomendaciones.');
        } else {
          this.errorState.set('Ocurrió un error al conectar con el motor de recomendaciones.');
        }
        return of(null);
      }),
      finalize(() => {
        this.isLoadingState.set(false);
      })
    ).subscribe({
      next: (products) => {
        if (products) {
          this.resolvedProductsState.set(products);
        }
      }
    });
  }

  abrirModalPromocion(): void {
    if (this.suggestedPromotionState()) {
      this.showModalState.set(true);
    }
  }

  private resolveProducts(productIds: string[]): Observable<Product[]> {
    if (!productIds || productIds.length === 0) return of([]);

    const requests = productIds.map(id =>
      this.productService.getById(id).pipe(
        catchError(() => of({ id, nombre: 'Producto no disponible', descripcion: '', precio: 0, peso: 0, requierePreparacion: false, stockActual: 0 } as Product))
      )
    );

    return forkJoin(requests);
  }

  private getCurrentPosition(): Observable<GeolocationPosition> {
    return new Observable<GeolocationPosition>((observer) => {
      if (!navigator.geolocation) {
        observer.error(new Error('La geolocalización no está soportada en tu navegador.'));
        observer.complete();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next(position);
          observer.complete();
        },
        (error) => {
          observer.error(error);
          observer.complete();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  confirmPromotion(formData: { discountPercentage: number, startDate: string, endDate: string, productIds: string[] }): void {
    this.isLoadingState.set(true);
    const buffetId = this.perfilService.obtenerBuffetId() ?? '';
    const suggested = this.suggestedPromotionState();
    
    const request = {
      name: suggested?.nombre || 'Promoción Estacional',
      discountPercentage: formData.discountPercentage,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      productIds: formData.productIds,
      buffetId: buffetId,
      isActive: true
    };

    this.promotionService.createPromotion(request).pipe(
      finalize(() => this.isLoadingState.set(false))
    ).subscribe({
      next: () => {
        this.toastService.mostrar('Promoción creada exitosamente', 'success');
        this.closeModal();
        this.router.navigateByUrl('/promociones');
      },
      error: () => {
        this.toastService.mostrar('Error al crear la promoción', 'error');
        this.router.navigateByUrl('/promociones');
      }
    });
  }

  closeModal(): void {
    this.showModalState.set(false);
  }
}
