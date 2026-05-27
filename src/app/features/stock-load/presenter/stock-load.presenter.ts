import { Injectable, inject } from '@angular/core';
import { StockLoadService } from '../models/stock-load.service';

export interface StockLoadView {
  showLoading(): void;
  hideLoading(): void;
  showSuccess(message: string): void;
  showError(message: string): void;
}

@Injectable()
export class StockLoadPresenter {
  private view!: StockLoadView;

  private StockLoadService = inject(StockLoadService);

  attachView(view: StockLoadView): void {
    this.view = view;
  }

  submitStockLoad(text: string, image: File | null): void {
    if (this.isInputInvalid(text, image)) return this.view.showError('Ingresa un texto o sube una imagen');

    this.view.showLoading();

    this.stockService.loadStock({ text, image: image || undefined }).subscribe({
      next: (response) => {
        this.view.hideLoading();
        if (response.success) this.view.showSuccess(response.message);
        else this.view.showError('Fallo al cargar el stock');
      },
      error: () => {
        this.view.hideLoading();
        this.view.showError('Ocurrio un error inesperado');
      }
    });
  }

  private isInputInvalid(text: string, image: File | null): boolean {
    return !text && !image;
  }
}