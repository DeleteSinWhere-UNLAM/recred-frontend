import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SugerenciaProducto, EstadisticasVenta } from '../models/sugerencia-producto.model';
import { Product } from '../../updated-inventory/models/product.interface';
import { SugerenciasService } from '../services/sugerencias.service';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { PromotionFormData } from '../components/combo-promotion-modal/combo-promotion-modal.component';

@Injectable()
export class SugerenciasPresenter {
  private readonly _sugerencias = new BehaviorSubject<SugerenciaProducto[]>([]);
  readonly sugerencias$ = this._sugerencias.asObservable();

  private readonly _sugerenciaSeleccionada = new BehaviorSubject<SugerenciaProducto | undefined>(undefined);
  readonly sugerenciaSeleccionada$ = this._sugerenciaSeleccionada.asObservable();

  private readonly _isComboModalOpen = new BehaviorSubject<boolean>(false);
  readonly isComboModalOpen$ = this._isComboModalOpen.asObservable();

  private readonly _suggestedProducts = new BehaviorSubject<Product[]>([]);
  readonly suggestedProducts$ = this._suggestedProducts.asObservable();

  private userId: string = '';

  constructor(
    private readonly sugerenciasService: SugerenciasService,
    private readonly promotionService: PromotionService
  ) { }

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
      this.sugerenciasService.getComboSuggestions(selected.productoOriginal, this.userId)
        .subscribe((suggestions) => {
          this._suggestedProducts.next(suggestions);
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
      const promotionData = {
        name: `Combo ${selected.productoOriginal}`,
        discountPercentage: formData.discountPercentage,
        startDate: formData.startDate,
        endDate: formData.endDate,
        productIds: [selected.productoOriginal, ...formData.productIds]
      };

      this.promotionService.createPromotion(promotionData).subscribe(() => {
        this.closeComboPromotionModal();
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

  private hasSugerencias(data: SugerenciaProducto[]): boolean {
    return data.length > 0;
  }

  private hasSelectedProduct(selected: SugerenciaProducto | undefined): selected is SugerenciaProducto {
    return selected !== undefined;
  }
}
