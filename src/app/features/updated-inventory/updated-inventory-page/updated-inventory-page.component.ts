import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductTableComponent } from '../components/product-table/product-table.component';
import { ProductFormComponent, ProductFormData } from '../components/product-form/product-form.component';
import { ConfirmDeleteModalComponent } from '../components/confirm-delete-modal/confirm-delete-modal.component';

const BUFFET_ID = '2c4153b3-d0f9-489c-93c0-8b3ad7b89758';
const HEALTH_CLASSIFICATION_IDS = ['f86358e0-0faf-4db0-bdda-09d8fb3a7cf2'];

@Component({
  selector: 'app-updated-inventory-page',
  standalone: true,
  imports: [ProductTableComponent, ProductFormComponent, ConfirmDeleteModalComponent],
  templateUrl: './updated-inventory-page.component.html',
  styleUrl: './updated-inventory-page.component.css'
})
export class UpdatedInventoryPageComponent implements OnInit {
  private productService = inject(ProductService);
  private toastService = inject(ToastService);

  products: Product[] = [];
  isLoading = false;
  isSaving = false;
  isFormVisible = false;
  selectedProduct: Product | null = null;
  deleteTarget: Product | null = null;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllByBuffetId(BUFFET_ID).subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.mostrar('Error al cargar los productos', 'error');
        this.isLoading = false;
      }
    });
  }

  openCreateForm(): void {
    this.selectedProduct = null;
    this.isFormVisible = true;
  }

  openEditForm(product: Product): void {
    this.selectedProduct = product;
    this.isFormVisible = true;
  }

  closeForm(): void {
    this.isFormVisible = false;
    this.selectedProduct = null;
  }

  handleFormSubmit(data: ProductFormData): void {
    this.isSaving = true;

    if (this.selectedProduct) {
      this.updateProduct(this.selectedProduct.id, data);
    } else {
      this.createProduct(data);
    }
  }

  requestDelete(product: Product): void {
    this.deleteTarget = product;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;

    const id = this.deleteTarget.id;
    this.deleteTarget = null;

    this.productService.delete(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
        this.toastService.mostrar('Producto eliminado correctamente', 'success');
      },
      error: () => {
        this.toastService.mostrar('Error al eliminar el producto', 'error');
      }
    });
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  private createProduct(data: ProductFormData): void {
    const payload: CreateProductRequest = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      categoriaId: null,
      nuevaCategoriaNombre: data.nuevaCategoriaNombre,
      buffetId: BUFFET_ID,
      stockActual: data.stockActual,
      clasificacionesSaludIds: HEALTH_CLASSIFICATION_IDS,
      tiposIds: null,
    };

    this.productService.create(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.loadProducts();
        this.toastService.mostrar('Producto creado exitosamente', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.toastService.mostrar('Error al crear el producto', 'error');
      }
    });
  }

  private updateProduct(id: string, data: ProductFormData): void {
    const payload: UpdateProductRequest = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      stockActual: data.stockActual,
      buffetId: BUFFET_ID,
      categoriaId: this.selectedProduct?.categoriaId || '',
      clasificacionesSaludIds: HEALTH_CLASSIFICATION_IDS,
    };

    this.productService.update(id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.loadProducts();
        this.toastService.mostrar('Producto actualizado exitosamente', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.toastService.mostrar('Error al actualizar el producto', 'error');
      }
    });
  }
}
