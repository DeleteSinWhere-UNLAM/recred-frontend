import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';
import { UploadSelectionModalComponent } from '../updated-inventory/components/upload-selection-modal/upload-selection-modal.component';
import { BulkUploadTableModalComponent } from '../updated-inventory/components/bulk-upload-table-modal/bulk-upload-table-modal.component';
import { AccionKiosquero } from './models/accion-kiosquero.model';
import { Router } from '@angular/router';
import { BulkUploadService, BulkProductResponse } from '../updated-inventory/services/bulk-upload.service';
import { ProductService } from '../updated-inventory/services/product.service';
import { ToastService } from '../../shared/services/toast.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { Category } from '../updated-inventory/models/category.interface';
import { CreateProductRequest } from '../updated-inventory/models/requests/create-product-request.interface';

const IMAGEN_FALLBACK =
  'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';

@Component({
  selector: 'app-home-kiosquero-page',
  templateUrl: './home-kiosquero.page.html',
  styleUrl: './home-kiosquero.page.css',
  imports: [NavbarComponent, UploadSelectionModalComponent, BulkUploadTableModalComponent],
  providers: [HomeKiosqueroPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeKiosqueroPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly bulkUploadService = inject(BulkUploadService);
  private readonly productService = inject(ProductService);
  private readonly toastService = inject(ToastService);
  private readonly perfilService = inject(PerfilService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly presenter = inject(HomeKiosqueroPresenter);

  protected readonly IMAGEN_FALLBACK = IMAGEN_FALLBACK;
  
  isUploadModalVisible = false;
  isBulkUploadModalVisible = false;
  isProcessingFile = false;
  bulkProductsData: BulkProductResponse[] = [];
  categories: Category[] = [];

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');
    this.presenter.init();
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: () => {
        this.toastService.mostrar('Error al cargar las categorías', 'error');
      },
    });
  }

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === IMAGEN_FALLBACK) return;
    img.src = IMAGEN_FALLBACK;
  }

  onActionClick(action: AccionKiosquero): void {
    if (action.id === 'cargar-productos') {
      this.isUploadModalVisible = true;
    } else {
      this.presenter.ejecutarAccion(action);
    }
  }

  goToIaUpload(): void {
    this.isUploadModalVisible = false;
    this.router.navigateByUrl('/cargar-producto-ia');
  }

  goToBulkUpload(): void {
    this.isUploadModalVisible = false;
    this.isBulkUploadModalVisible = true;
    this.bulkProductsData = [];
  }

  closeUploadModal(): void {
    this.isUploadModalVisible = false;
  }

  closeBulkUploadModal(): void {
    this.isBulkUploadModalVisible = false;
    this.bulkProductsData = [];
    this.isProcessingFile = false;
  }

  handleFileUpload(file: File): void {
    this.isProcessingFile = true;
    this.bulkUploadService.uploadFile(file).subscribe({
      next: (res) => {
        this.bulkProductsData = res.products;
        this.isProcessingFile = false;
        this.toastService.mostrar('Archivo procesado correctamente', 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        this.isProcessingFile = false;
        this.toastService.mostrar('Error al procesar el archivo', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  handleBulkProductsSave(products: BulkProductResponse[]): void {
    const currentBuffetId = this.perfilService.obtenerBuffetId();
    if (!currentBuffetId) {
      this.toastService.mostrar('No se encontró un buffet asociado a tu perfil', 'error');
      return;
    }

    this.isProcessingFile = true;

    const normalizedNewCategories = new Map<string, string>();

    const createRequests: CreateProductRequest[] = products.map((prod) => {
      const isNewCategory = prod.categoriaId === 'NEW';
      let finalNuevaCategoriaNombre = '';

      if (isNewCategory && prod.nuevaCategoriaNombre) {
        const rawName = prod.nuevaCategoriaNombre.trim();
        const key = rawName.toLowerCase();
        
        if (!normalizedNewCategories.has(key)) {
          normalizedNewCategories.set(key, rawName);
        }
        finalNuevaCategoriaNombre = normalizedNewCategories.get(key)!;
      }

      return {
        nombre: prod.nombre,
        descripcion: prod.descripcion ?? '',
        precio: prod.precio,
        peso: prod.peso,
        requierePreparacion: prod.requierePreparacion,
        categoriaId: isNewCategory ? null : prod.categoriaId,
        nuevaCategoriaNombre: finalNuevaCategoriaNombre,
        buffetId: currentBuffetId,
        stockActual: prod.stockActual,
        clasificacionesSaludIds: prod.saludEtiquetasIds ?? [],
        tiposIds: null,
      };
    });

    this.productService.createBulk(createRequests).subscribe({
      next: () => {
        this.isProcessingFile = false;
        this.closeBulkUploadModal();
        this.toastService.mostrar('Productos cargados exitosamente', 'success');
        this.cdr.markForCheck();
        this.router.navigateByUrl('/admin-productos');
      },
      error: () => {
        this.isProcessingFile = false;
        this.toastService.mostrar('Error al guardar los productos', 'error');
        this.cdr.markForCheck();
      },
    });
  }
}
