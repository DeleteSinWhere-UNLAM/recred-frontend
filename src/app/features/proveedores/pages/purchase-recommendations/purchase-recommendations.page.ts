import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  imports: [NavbarComponent, CurrencyPipe, FormsModule],
  templateUrl: './purchase-recommendations.page.html',
  styleUrl: './purchase-recommendations.page.css'
})
export class PurchaseRecommendationsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductoService);
  private readonly toastService = inject(ToastService);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreKiosquero = this.usuarioService.nombreNavbar;

  // States
  products = signal<Producto[]>([]);
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('TODAS');
  selectedProductIds = signal<Set<string>>(new Set<string>());
  recommendations = signal<RecomendacionProveedor[]>([]);
  isLoading = signal<boolean>(false);
  isFetchingRecommendations = signal<boolean>(false);

  // Derived categories list
  readonly categories = computed(() => {
    const list = this.products();
    const map = new Map<string, string>();
    list.forEach(p => {
      if (p.categoria) {
        map.set(p.categoria.id, p.categoria.descripcion);
      } else if (p.categoriaId && p.categoriaNombre) {
        map.set(p.categoriaId, p.categoriaNombre);
      }
    });
    return Array.from(map.entries()).map(([id, desc]) => ({ id, desc }));
  });

  // Derived filtered products list
  readonly filteredProducts = computed(() => {
    let list = this.products();
    const query = this.searchQuery().toLowerCase().trim();
    const catId = this.selectedCategory();

    if (query) {
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(query))
      );
    }

    if (catId !== 'TODAS') {
      list = list.filter(p => {
        const pCatId = p.categoria?.id || p.categoriaId;
        return pCatId === catId;
      });
    }

    return list;
  });

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
        
        // Auto-select low stock products if the query parameter is present
        this.route.queryParams.subscribe(params => {
          if (params['preselect'] === 'low-stock') {
            this.autoSelectLowStock();
          }
        });
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
    const selected = new Set(this.selectedProductIds());
    this.filteredProducts().forEach(p => {
      if (this.isLowStock(p)) {
        selected.add(p.id);
      }
    });
    this.selectedProductIds.set(selected);
    this.toastService.mostrar('Productos visibles con bajo stock seleccionados', 'success');
  }

  selectAll(): void {
    const selected = new Set(this.selectedProductIds());
    this.filteredProducts().forEach(p => selected.add(p.id));
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
        // Sort recommendations: items with quotations first, non-quoted at the end
        const sorted = [...results].sort((a, b) => {
          const aHas = !!a.proveedorRecomendadoId;
          const bHas = !!b.proveedorRecomendadoId;
          if (aHas === bHas) return 0;
          return aHas ? -1 : 1;
        });
        this.recommendations.set(sorted);
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

  exportToCsv(): void {
    const list = this.recommendations();
    if (list.length === 0) return;

    let csvContent = '\uFEFF'; // BOM to support Excel Spanish characters
    csvContent += 'Producto;Proveedor Recomendado;Precio de Compra;Unidad;Precio Unitario\n';

    list.forEach((rec) => {
      const bestPrice = rec.mejorPrecio || 0;
      const unitPrice = rec.mejorPrecioUnitario || bestPrice;
      const hasQuote = !!rec.proveedorRecomendadoId;

      csvContent += `"${rec.nombreProducto.replace(/"/g, '""')}";` +
        `"${hasQuote ? rec.nombreProveedorRecomendado.replace(/"/g, '""') : 'Sin cotización'}";` +
        `"${hasQuote ? bestPrice : ''}";` +
        `"${rec.unidad || ''}";` +
        `"${hasQuote ? unitPrice : ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `recomendaciones_compra_${new Date().toISOString().slice(0, 10)}.csv`;
    this.saveFile(blob, filename);
    this.toastService.mostrar('Reporte de Excel (CSV) descargado con éxito', 'success');
  }

  exportToPdf(): void {
    const list = this.recommendations();
    if (list.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.toastService.mostrar('No se pudo abrir la ventana de impresión. Habilitá los pop-ups.', 'error');
      return;
    }

    const dateStr = new Date().toLocaleDateString('es-AR');
    let html = `
      <html>
      <head>
        <title>Recomendación de Compra - Recred</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #334155; line-height: 1.5; }
          h1 { color: #4A6FA5; margin-bottom: 5px; font-size: 24px; }
          p { margin-top: 0; color: #64748B; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 25px; }
          th, td { border: 1px solid #E2E8F0; padding: 12px 15px; text-align: left; font-size: 14px; }
          th { background-color: #F8FAFC; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
          .badge-warning { background-color: #FEF3C7; color: #92400E; }
          .badge-success { background-color: #D1FAE5; color: #065F46; }
          .price { font-weight: 600; color: #334155; }
          .text-right { text-align: right; }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>Reporte de Compras Recomendadas</h1>
        <p>Generado el: ${dateStr}</p>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Proveedor Recomendado</th>
              <th class="text-right">Precio de Compra</th>
              <th>Unidad</th>
              <th class="text-right">Precio Unitario</th>
            </tr>
          </thead>
          <tbody>
    `;

    list.forEach(rec => {
      const hasQuote = !!rec.proveedorRecomendadoId;
      const formattedPrice = hasQuote ? `$${rec.mejorPrecio.toFixed(2)}` : '-';
      const formattedUnitPrice = hasQuote ? `$${(rec.mejorPrecioUnitario || rec.mejorPrecio).toFixed(2)}` : '-';

      html += `
        <tr>
          <td><strong>${rec.nombreProducto}</strong></td>
          <td>
            <span class="badge ${hasQuote ? 'badge-success' : 'badge-warning'}">
              ${hasQuote ? rec.nombreProveedorRecomendado : 'Sin cotización'}
            </span>
          </td>
          <td class="text-right price">${formattedPrice}</td>
          <td>${rec.unidad || 'unidad'}</td>
          <td class="text-right price">${formattedUnitPrice}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  private saveFile(file: Blob, filename: string): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
