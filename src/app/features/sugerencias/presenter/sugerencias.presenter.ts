import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SugerenciaProducto, EstadisticasVenta, SuggestedProduct } from '../models/sugerencia-producto.model';
import { SugerenciasService } from '../services/sugerencias.service';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { PromotionFormData } from '../components/combo-promotion-modal/combo-promotion-modal.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { buildCloudinaryCollageUrl } from '../../../shared/utils/cloudinary-collage.helper';

@Injectable()
export class SugerenciasPresenter {
  private readonly _sugerencias = new BehaviorSubject<SugerenciaProducto[]>([]);
  readonly sugerencias$ = this._sugerencias.asObservable();

  private readonly _sugerenciaSeleccionada = new BehaviorSubject<SugerenciaProducto | undefined>(undefined);
  readonly sugerenciaSeleccionada$ = this._sugerenciaSeleccionada.asObservable();

  private readonly _isComboModalOpen = new BehaviorSubject<boolean>(false);
  readonly isComboModalOpen$ = this._isComboModalOpen.asObservable();

  private readonly _suggestedProducts = new BehaviorSubject<SuggestedProduct[]>([]);
  readonly suggestedProducts$ = this._suggestedProducts.asObservable();

  private userId = '';

  private readonly sugerenciasService = inject(SugerenciasService);
  private readonly promotionService = inject(PromotionService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly productService = inject(ProductoService);

  initialize(userId: string): void {
    this.userId = userId;
    this.sugerenciasService.getSugerencias(this.userId).subscribe((data) => {
      this._sugerencias.next(data);
      if (this.hasSugerencias(data)) {
        this.seleccionarProducto(data[0]);
      }
    });
  }

  seleccionarProducto(sugerencia: SugerenciaProducto): void {
    this._sugerenciaSeleccionada.next(sugerencia);
  }

  openComboPromotionModal(): void {
    const selected = this._sugerenciaSeleccionada.getValue();

    if (this.hasSelectedProduct(selected)) {
      this.sugerenciasService.getComboSuggestions(selected.estadisticasVenta.productoId, this.userId)
        .subscribe((suggestions) => {
          console.log(suggestions);
          this._suggestedProducts.next(suggestions.suggestedProducts);
          this._isComboModalOpen.next(true);
        });
    }
  }

  closeComboPromotionModal(): void {
    this._isComboModalOpen.next(false);
    this._suggestedProducts.next([]);
  }

  generatePromotion(formData: PromotionFormData): void {
    const selected = this._sugerenciaSeleccionada.getValue();
    if (this.hasSelectedProduct(selected)) {
      const productIds = [selected.estadisticasVenta.productoId, ...formData.productIds];
      
      forkJoin(
        productIds.map(id => 
          this.productService.getById(id).pipe(
            catchError(() => of({ id, urlImagen: null } as any))
          )
        )
      ).pipe(
        switchMap((products) => {
          const imageUrls = products.map(p => p.urlImagen);
          const collageUrl = buildCloudinaryCollageUrl(imageUrls);
          
          const promotionData = {
            name: `Combo ${selected.productoOriginal}`,
            discountPercentage: formData.discountPercentage,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            productIds: productIds,
            imageUrl: collageUrl
          };
          
          return this.promotionService.createPromotion(promotionData);
        })
      ).subscribe({
        next: () => {
          this.closeComboPromotionModal();
          this.toastService.mostrar("Combo creado exitosamente", "success");
          this.router.navigateByUrl('/promociones');
        },
        error: () => {
          this.toastService.mostrar("Error al crear el combo", "error");
          this.router.navigateByUrl('/promociones');
        }
      });
    }
  }

  get totalProductosAnalizados(): number {
    return this._sugerencias.getValue().length;
  }

  get totalStockInmovilizado(): number {
    return this._sugerencias.getValue().reduce(
      (total, sugerencia) => total + (sugerencia.estadisticasVenta.stockActual ?? 0),
      0,
    );
  }

  get promedioDiasSinVenta(): number {
    const sugerencias = this._sugerencias.getValue();
    if (!this.hasSugerencias(sugerencias)) {
      return 0;
    }
    const totalDias = sugerencias.reduce(
      (total, sugerencia) => total + (sugerencia.estadisticasVenta.diasSinVenta ?? 0),
      0,
    );
    return Math.round(totalDias / sugerencias.length);
  }

  get productoMasCritico(): SugerenciaProducto | undefined {
    const sugerencias = this._sugerencias.getValue();
    return [...sugerencias].sort(
      (a, b) => b.estadisticasVenta.diasSinVenta - a.estadisticasVenta.diasSinVenta,
    )[0];
  }

  get estadisticasSeleccionadas(): EstadisticasVenta | undefined {
    return this._sugerenciaSeleccionada.getValue()?.estadisticasVenta;
  }

  /** Horizontal bar chart: days without sale per product (sorted worst → best) */
  get chartDiasSinVenta(): { nombre: string; dias: number; percent: number; stock: number; ventas: number }[] {
    const sugerencias = this._sugerencias.getValue();
    if (!this.hasSugerencias(sugerencias)) return [];

    const sorted = [...sugerencias].sort(
      (a, b) => b.estadisticasVenta.diasSinVenta - a.estadisticasVenta.diasSinVenta,
    );
    const maxDias = sorted[0].estadisticasVenta.diasSinVenta || 1;

    return sorted.map((s) => ({
      nombre: s.productoOriginal,
      dias: s.estadisticasVenta.diasSinVenta,
      percent: Math.round((s.estadisticasVenta.diasSinVenta / maxDias) * 100),
      stock: s.estadisticasVenta.stockActual,
      ventas: s.estadisticasVenta.ventasPeriodo,
    }));
  }

  /** Vertical bar chart: stock vs ventas per product */
  get chartStockVsVentas(): { nombre: string; stock: number; stockPercent: number; ventas: number; ventasPercent: number }[] {
    const sugerencias = this._sugerencias.getValue();
    if (!this.hasSugerencias(sugerencias)) return [];

    const maxStock = Math.max(...sugerencias.map((s) => s.estadisticasVenta.stockActual), 1);
    const maxVentas = Math.max(...sugerencias.map((s) => s.estadisticasVenta.ventasPeriodo), 1);

    return sugerencias.map((s) => ({
      nombre: s.productoOriginal,
      stock: s.estadisticasVenta.stockActual,
      stockPercent: Math.round((s.estadisticasVenta.stockActual / maxStock) * 100),
      ventas: s.estadisticasVenta.ventasPeriodo,
      ventasPercent: Math.round((s.estadisticasVenta.ventasPeriodo / maxVentas) * 100),
    }));
  }

  private hasSugerencias(data: SugerenciaProducto[]): boolean {
    return data.length > 0;
  }

  private hasSelectedProduct(selected: SugerenciaProducto | undefined): selected is SugerenciaProducto {
    return selected !== undefined;
  }
}
