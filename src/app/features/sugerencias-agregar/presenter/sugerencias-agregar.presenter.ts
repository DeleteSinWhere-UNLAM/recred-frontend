import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SugerenciaAgregarProducto } from '../models/sugerencia-agregar.model';
import { SugerenciasAgregarService } from '../services/sugerencias-agregar.service';

export interface ChartBarItem {
  nombre: string;
  ventas: number;
  ingresos: number;
  clientes: number;
  precio: number;
  ingresoPercent: number;
}

export interface ProductCard {
  id: string;
  nombre: string;
  precio: number;
  ventas: number;
  ingresos: number;
  clientes: number;
  mensaje: string;
  ingresoPercent: number;
}

@Injectable()
export class SugerenciasAgregarPresenter {
  private readonly _sugerencias = new BehaviorSubject<SugerenciaAgregarProducto[]>([]);
  readonly sugerencias$ = this._sugerencias.asObservable();

  private readonly _isLoading = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this._isLoading.asObservable();

  private readonly _error = new BehaviorSubject<string | null>(null);
  readonly error$ = this._error.asObservable();

  constructor(private readonly sugerenciasService: SugerenciasAgregarService) {}

  initialize(): void {
    this._isLoading.next(true);
    this._error.next(null);

    this.sugerenciasService.getSugerenciasAgregarProducto().subscribe({
      next: (data) => {
        this._sugerencias.next(data);
        this._isLoading.next(false);
      },
      error: () => {
        this._error.next('No se pudieron cargar las oportunidades de stock.');
        this._isLoading.next(false);
      },
    });
  }

  /* ── KPI computados ── */

  get totalProductos(): number {
    return this._sugerencias.getValue().length;
  }

  get totalVentas(): number {
    return this._sugerencias.getValue().reduce(
      (sum, s) => sum + s.metadata.totalSales, 0,
    );
  }

  get totalIngresos(): number {
    return this._sugerencias.getValue().reduce(
      (sum, s) => sum + s.metadata.totalRevenue, 0,
    );
  }

  get totalIngresosLabel(): string {
    return this.formatCurrency(this.totalIngresos);
  }

  get totalClientes(): number {
    return this._sugerencias.getValue().reduce(
      (sum, s) => sum + s.metadata.totalCustomers, 0,
    );
  }

  get chartData(): ChartBarItem[] {
    const sugerencias = this._sugerencias.getValue();
    if (sugerencias.length === 0) return [];

    const sorted = [...sugerencias].sort(
      (a, b) => b.metadata.totalRevenue - a.metadata.totalRevenue,
    );
    const maxIngreso = sorted[0].metadata.totalRevenue || 1;

    return sorted.map((s) => ({
      nombre: s.metadata.productName,
      ventas: s.metadata.totalSales,
      ingresos: s.metadata.totalRevenue,
      clientes: s.metadata.totalCustomers,
      precio: s.metadata.productPrice,
      ingresoPercent: Math.round((s.metadata.totalRevenue / maxIngreso) * 100),
    }));
  }


  get productCards(): ProductCard[] {
    const sugerencias = this._sugerencias.getValue();
    if (sugerencias.length === 0) return [];

    const maxIngreso = Math.max(...sugerencias.map((s) => s.metadata.totalRevenue), 1);

    return [...sugerencias]
      .sort((a, b) => b.metadata.totalRevenue - a.metadata.totalRevenue)
      .map((s) => ({
        id: s.id,
        nombre: s.metadata.productName,
        precio: s.metadata.productPrice,
        ventas: s.metadata.totalSales,
        ingresos: s.metadata.totalRevenue,
        clientes: s.metadata.totalCustomers,
        mensaje: s.mensaje,
        ingresoPercent: Math.round((s.metadata.totalRevenue / maxIngreso) * 100),
      }));
  }

  formatCurrency(value: number): string {
    return '$' + value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
