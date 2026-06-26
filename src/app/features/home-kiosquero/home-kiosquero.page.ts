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
import { ModalSeleccionCargaComponent } from '../inventario/components/modal-seleccion-carga/modal-seleccion-carga.component';
import { ModalTablaCargaMasivaComponent } from '../inventario/components/modal-tabla-carga-masiva/modal-tabla-carga-masiva.component';
import { AccionKiosquero } from './models/accion-kiosquero.model';
import { Router } from '@angular/router';
import { CargaMasivaService, RespuestaProductoMasivo } from '../inventario/services/carga-masiva.service';
import { ProductoService } from '../inventario/services/producto.service';
import { ToastService } from '../../shared/services/toast.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { Categoria } from '../inventario/models/categoria.interface';
import { SolicitudCrearProducto } from '../inventario/models/requests/crear-producto-request.interface';
import { FormularioProductoComponent, DatosFormularioProducto } from '../inventario/components/formulario-producto/formulario-producto.component';

const IMAGEN_FALLBACK =
  'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';

@Component({
  selector: 'app-home-kiosquero-page',
  templateUrl: './home-kiosquero.page.html',
  styleUrl: './home-kiosquero.page.css',
  imports: [NavbarComponent, ModalSeleccionCargaComponent, ModalTablaCargaMasivaComponent, FormularioProductoComponent],
  providers: [HomeKiosqueroPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeKiosqueroPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly bulkUploadService = inject(CargaMasivaService);
  private readonly productService = inject(ProductoService);
  private readonly toastService = inject(ToastService);
  private readonly perfilService = inject(PerfilService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly presenter = inject(HomeKiosqueroPresenter);

  protected readonly IMAGEN_FALLBACK = IMAGEN_FALLBACK;
  
  isUploadModalVisible = false;
  isBulkUploadModalVisible = false;
  isProcessingFile = false;
  isManualProductFormVisible = false;
  isSavingManualProduct = false;
  bulkProductsData: RespuestaProductoMasivo[] = [];
  categories: Categoria[] = [];

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

  goToManualUpload(): void {
    this.isUploadModalVisible = false;
    this.isManualProductFormVisible = true;
  }

  goToBulkUpload(): void {
    this.isUploadModalVisible = false;
    this.isBulkUploadModalVisible = true;
    this.bulkProductsData = [];
  }

  closeUploadModal(): void {
    this.isUploadModalVisible = false;
  }

  get buffetId(): string | null {
    return this.perfilService.obtenerBuffetId();
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

  handleBulkProductsSave(products: RespuestaProductoMasivo[]): void {
    const currentBuffetId = this.perfilService.obtenerBuffetId();
    if (!currentBuffetId) {
      this.toastService.mostrar('No se encontró un buffet asociado a tu perfil', 'error');
      return;
    }

    this.isProcessingFile = true;

    const normalizedNewCategories = new Map<string, string>();

    const createRequests: SolicitudCrearProducto[] = products.map((prod) => {
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

  handleManualProductSubmit(data: DatosFormularioProducto): void {
    const currentBuffetId = this.perfilService.obtenerBuffetId();
    if (!currentBuffetId) {
      this.toastService.mostrar('No se encontró un buffet asociado a tu perfil', 'error');
      return;
    }

    this.isSavingManualProduct = true;
    
    const CLASIFICACION_SIN_TACC = '15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8';
    const CLASIFICACION_SIN_AZUCAR = '7e113952-93ca-4797-a80d-54f3a31b2165';
    const CLASIFICACION_CONTIENE_LACTEOS = 'a087290b-474e-4a8c-9e5d-ce1c375d4009';

    const buildHealthClassificationIds = (formData: DatosFormularioProducto): string[] => {
      const ids: string[] = [];
      if (!formData.contiene_tacc) ids.push(CLASIFICACION_SIN_TACC);
      if (!formData.contiene_azucar) ids.push(CLASIFICACION_SIN_AZUCAR);
      if (formData.contiene_lactosa) ids.push(CLASIFICACION_CONTIENE_LACTEOS);
      return ids;
    };

    const isNewCategory = data.categoriaId === "NEW";
    const payload: SolicitudCrearProducto = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      categoriaId: isNewCategory ? null : data.categoriaId,
      nuevaCategoriaNombre: isNewCategory ? data.nuevaCategoriaNombre : "",
      buffetId: currentBuffetId,
      stockActual: data.stockActual,
      clasificacionesSaludIds: buildHealthClassificationIds(data),
      tiposIds: null,
      urlImagen: data.urlImagen
    };

    this.productService.create(payload).subscribe({
      next: () => {
        this.isSavingManualProduct = false;
        this.isManualProductFormVisible = false;
        this.toastService.mostrar("Producto creado exitosamente", "success");
        this.cdr.markForCheck();
        this.router.navigateByUrl('/admin-productos');
      },
      error: () => {
        this.isSavingManualProduct = false;
        this.toastService.mostrar("Error al crear el producto", "error");
        this.cdr.markForCheck();
      },
    });
  }
}
