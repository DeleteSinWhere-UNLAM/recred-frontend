import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { ProductoService } from '../../../inventario/services/producto.service';
import { Producto } from '../../../inventario/models/producto.interface';
import { SupplierResponse, ListaPrecioProveedorResponse, ItemListaPrecioProveedorResponse } from '../../models/proveedores.interfaces';
import { ToastService } from '../../../../shared/services/toast.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../../data-access/services/usuario.service';

@Component({
  selector: 'app-price-list-mapping',
  standalone: true,
  imports: [NavbarComponent, FormsModule, CurrencyPipe],
  templateUrl: './price-list-mapping.page.html',
  styleUrl: './price-list-mapping.page.css'
})
export class PriceListMappingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductoService);
  private readonly toastService = inject(ToastService);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreKiosquero = this.usuarioService.nombreNavbar;


  listaPrecioId = '';
  supplier = signal<SupplierResponse | null>(null);
  priceList = signal<ListaPrecioProveedorResponse | null>(null);
  items = signal<ItemListaPrecioProveedorResponse[]>([]);
  inventoryProducts = signal<Producto[]>([]);
  isLoading = signal<boolean>(false);


  activeDropdownRowId = signal<string | null>(null);
  productSearchQuery = signal<string>('');

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const listId = params.get('listaPrecioId');
      if (listId) {
        this.listaPrecioId = listId;
        this.loadInventoryProducts();
        this.loadPriceListDetails();
      } else {
        this.toastService.mostrar('Lista de precios no especificada', 'error');
        this.router.navigateByUrl('/kiosquero/proveedores');
      }
    });
  }

  private loadInventoryProducts(): void {
    this.productService.getAll().subscribe({
      next: (prods) => {
        this.inventoryProducts.set(prods);
      },
      error: (err) => {
        console.error('Error loading inventory products', err);
        this.toastService.mostrar('Error al cargar productos del inventario para mapear', 'error');
      }
    });
  }

  private loadPriceListDetails(): void {
    this.isLoading.set(true);
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        let foundSupplier: SupplierResponse | null = null;
        let foundList: ListaPrecioProveedorResponse | null = null;

        for (const s of suppliers) {
          const l = s.listasPrecios?.find(list => list.id === this.listaPrecioId);
          if (l) {
            foundSupplier = s;
            foundList = l;
            break;
          }
        }

        if (foundSupplier && foundList) {
          this.supplier.set(foundSupplier);
          this.priceList.set(foundList);


          this.supplierService.getSupplierById(foundSupplier.id).subscribe({
            next: (detail) => {
              const listDetail = detail.listasPrecios?.find(list => list.id === this.listaPrecioId);
              if (listDetail) {
                this.priceList.set(listDetail);
                this.items.set(listDetail.items || []);
              }
              this.isLoading.set(false);
            },
            error: (err) => {
              console.error('Error fetching full supplier details', err);
              this.isLoading.set(false);
            }
          });
        } else {
          this.toastService.mostrar('Lista de precios no encontrada', 'error');
          this.isLoading.set(false);
          this.router.navigateByUrl('/kiosquero/proveedores');
        }
      },
      error: (err) => {
        console.error('Error fetching suppliers list', err);
        this.toastService.mostrar('Error al ubicar la lista de precios', 'error');
        this.isLoading.set(false);
        this.router.navigateByUrl('/kiosquero/proveedores');
      }
    });
  }

  confirmMapping(item: ItemListaPrecioProveedorResponse): void {
    if (!item.productoInventarioId) {
      this.toastService.mostrar('Asociá un producto del inventario primero', 'error');
      return;
    }

    this.supplierService.updateMapping(item.id, item.productoInventarioId).subscribe({
      next: (updated) => {
        this.toastService.mostrar(`Mapeo confirmado para ${item.nombreProductoProveedor}`, 'success');
        this.updateItemInState(updated);
      },
      error: (err) => {
        console.error('Error confirming mapping', err);
        this.toastService.mostrar('Error al confirmar el mapeo', 'error');
      }
    });
  }

  selectProduct(item: ItemListaPrecioProveedorResponse, product: Producto | null): void {
    const productId = product ? product.id : null;

    this.supplierService.updateMapping(item.id, productId).subscribe({
      next: (updated) => {
        this.toastService.mostrar(`Mapeo actualizado para ${item.nombreProductoProveedor}`, 'success');
        this.updateItemInState(updated);
        this.closeProductDropdown();
      },
      error: (err) => {
        console.error('Error updating mapping', err);
        this.toastService.mostrar('Error al actualizar el mapeo del producto', 'error');
      }
    });
  }

  private updateItemInState(updatedItem: ItemListaPrecioProveedorResponse): void {
    this.items.update(currentItems =>
      currentItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  }


  openProductDropdown(rowId: string, event: Event): void {
    event.stopPropagation();
    this.activeDropdownRowId.set(rowId);
    this.productSearchQuery.set('');
  }

  closeProductDropdown(): void {
    this.activeDropdownRowId.set(null);
    this.productSearchQuery.set('');
  }

  getFilteredInventoryProducts(): Producto[] {
    const query = this.productSearchQuery().toLowerCase().trim();
    if (!query) {
      return this.inventoryProducts();
    }
    return this.inventoryProducts().filter(p =>
      p.nombre.toLowerCase().includes(query)
    );
  }

  volver(): void {
    const sup = this.supplier();
    if (sup) {
      this.router.navigate(['/kiosquero/proveedores', sup.id]);
    } else {
      this.router.navigateByUrl('/kiosquero/proveedores');
    }
  }
}
