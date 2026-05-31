import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.interface';
import { Category } from '../models/category.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductTableComponent } from '../components/product-table/product-table.component';
import { ProductFormComponent, ProductFormData } from '../components/product-form/product-form.component';
import { ConfirmDeleteModalComponent } from '../components/confirm-delete-modal/confirm-delete-modal.component';

const BUFFET_ID = 'ebfc7afc-6b2e-46a6-ba8f-bb2902a6bfd9';
const HEALTH_CLASSIFICATION_IDS = ['214e9d21-b049-43af-be09-08fb0b445828'];

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
  categories: Category[] = [];
  isLoading = false;
  isSaving = false;
  isFormVisible = false;
  selectedProduct: Product | null = null;
  deleteTarget: Product | null = null;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: () => {
        this.toastService.mostrar('Error al cargar las categorías', 'error');
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllByBuffetId(BUFFET_ID).subscribe({
      next: (data) => {
        this.products = data.map(p => ({
          ...p,
          categoriaId: p.categoria?.id || null,
          categoriaNombre: p.categoria?.descripcion || ''
        }));
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
    const isNewCategory = data.categoriaId === 'NEW';
    const payload: CreateProductRequest = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      categoriaId: isNewCategory ? null : data.categoriaId,
      nuevaCategoriaNombre: isNewCategory ? data.nuevaCategoriaNombre : "",
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
    const isNewCategory = data.categoriaId === 'NEW';
    const payload: UpdateProductRequest = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      stockActual: data.stockActual,
      buffetId: BUFFET_ID,
      categoriaId: isNewCategory ? "" : (data.categoriaId || ''), // Update might not support creating categories on the fly, but we adapt it
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
