import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { ProductoService } from '../../../inventario/services/producto.service';
import { Producto } from '../../../inventario/models/producto.interface';
import { RecomendacionProveedor } from '../../models/proveedores.interfaces';
import { ToastService } from '../../../../shared/services/toast.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-purchase-recommendations',
  standalone: true,
  imports: [NavbarComponent, CurrencyPipe],
  templateUrl: './purchase-recommendations.page.html',
  styleUrl: './purchase-recommendations.page.css'
})
export class PurchaseRecommendationsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductoService);
  private readonly toastService = inject(ToastService);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreKiosquero = this.usuarioService.nombreNavbar;

  // States
  products = signal<Producto[]>([]);
  selectedProductIds = signal<Set<string>>(new Set<string>());
  recommendations = signal<RecomendacionProveedor[]>([]);
  isLoading = signal<boolean>(false);
  isFetchingRecommendations = signal<boolean>(false);

  // UI Accordion State
  expandedProductAccordions = signal<Set<string>>(new Set<string>());

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
        // Automatically select low stock products for premium user helper
        this.autoSelectLowStock();
      },
      error: (err) => {
        console.error('Error loading inventory products', err);
        this.toastService.mostrar('Error al cargar productos para comparar', 'error');
        this.isLoading.set(false);
      }
    });
  }

  autoSelectLowStock(): void {
    const lowStock = this.products().filter(p => this.isLowStock(p));
    if (lowStock.length > 0) {
      const selected = new Set<string>();
      lowStock.forEach(p => selected.add(p.id));
      this.selectedProductIds.set(selected);
      this.toastService.mostrar(`Se pre-seleccionaron ${lowStock.length} productos con bajo stock`, 'info');
    }
  }

  isLowStock(product: Producto): boolean {
    // Treat as low stock if stockActual is 5 or less
    return product.stockActual <= 5;
  }

  toggleProductSelection(productId: string): void {
    const selected = new Set(this.selectedProductIds());
    if (selected.has(productId)) {
      selected.delete(productId);
    } else {
      selected.add(productId);
    }
    this.selectedProductIds.set(selected);
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  selectAllLowStock(): void {
    const selected = new Set<string>();
    this.products().forEach(p => {
      if (this.isLowStock(p)) {
        selected.add(p.id);
      }
    });
    this.selectedProductIds.set(selected);
    this.toastService.mostrar('Bajo stock seleccionado', 'success');
  }

  selectAll(): void {
    const selected = new Set<string>();
    this.products().forEach(p => selected.add(p.id));
    this.selectedProductIds.set(selected);
  }

  clearSelection(): void {
    this.selectedProductIds.set(new Set<string>());
    this.recommendations.set([]);
  }

  getRecommendations(): void {
    const ids = Array.from(this.selectedProductIds());
    if (ids.length === 0) {
      this.toastService.mostrar('Seleccioná al menos un producto para cotizar', 'error');
      return;
    }

    this.isFetchingRecommendations.set(true);
    this.supplierService.getPurchaseRecommendations(ids).subscribe({
      next: (results) => {
        this.recommendations.set(results);
        this.isFetchingRecommendations.set(false);
        this.expandedProductAccordions.set(new Set<string>()); // Reset accordions
        this.toastService.mostrar('Comparación finalizada con éxito', 'success');
      },
      error: (err) => {
        console.error('Error fetching recommendations', err);
        this.toastService.mostrar('Error al cotizar mejores precios de compra', 'error');
        this.isFetchingRecommendations.set(false);
      }
    });
  }

  toggleAccordion(productId: string): void {
    const expanded = new Set(this.expandedProductAccordions());
    if (expanded.has(productId)) {
      expanded.delete(productId);
    } else {
      expanded.add(productId);
    }
    this.expandedProductAccordions.set(expanded);
  }

  isAccordionExpanded(productId: string): boolean {
    return this.expandedProductAccordions().has(productId);
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero/proveedores');
  }
}
