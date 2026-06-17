import { HttpErrorResponse } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';
import { CreateProductRequest } from '../models/requests/create-product-request.interface';
import { UpdateProductRequest } from '../models/requests/update-product-request.interface';
import { Category } from '../models/category.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ProductTableComponent } from '../components/product-table/product-table.component';
import { ProductFormComponent, ProductFormData } from '../components/product-form/product-form.component';
import { ConfirmDeleteModalComponent } from '../components/confirm-delete-modal/confirm-delete-modal.component';
import { InventoryRealtimeService } from '../services/inventory-realtime.service';
import {
  EstadoInventario,
  InventoryOverviewItem,
  InventoryStockMovement,
  InventoryStockUpdateRequest,
  RealtimeInventoryEvent,
  TipoManejoInventario,
} from '../models/inventory.interface';
import {
  compareByOperationalStatus,
  getOperationalStockStatus,
} from '../models/inventory-visual-state';

const CLASIFICACION_SIN_TACC = '15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8';
const CLASIFICACION_SIN_AZUCAR = '7e113952-93ca-4797-a80d-54f3a31b2165';
const CLASIFICACION_CONTIENE_LACTEOS = 'a087290b-474e-4a8c-9e5d-ce1c375d4009';

function buildHealthClassificationIds(data: ProductFormData): string[] {
  const ids: string[] = [];
  if (!data.contiene_tacc) ids.push(CLASIFICACION_SIN_TACC);
  if (!data.contiene_azucar) ids.push(CLASIFICACION_SIN_AZUCAR);
  if (data.contiene_lactosa) ids.push(CLASIFICACION_CONTIENE_LACTEOS);
  return ids;
}

const INVENTORY_ERROR_MESSAGES: Record<string, string> = {
  STOCK_INSUFFICIENT: 'No hay stock suficiente.',
  INVENTORY_OPERATION_INVALID: 'La operación de inventario no es válida para este producto.',
  PRODUCT_DAILY_CAPACITY_EXCEEDED: 'El cupo diario de este producto está agotado.',
  FORBIDDEN: 'No tenés permisos sobre este buffet.',
  NOT_FOUND: 'No se encontró el producto o inventario.',
  BAD_REQUEST: 'Revisa los datos ingresados.',
};

type InventoryFilter =
  | 'TODOS'
  | 'DISPONIBLE'
  | 'BAJO_STOCK'
  | 'ALTA_RESERVA'
  | 'PAUSADO'
  | 'AGOTADO';
type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

const PRODUCT_HIGHLIGHT_DURATION_MS = 3000;
const INVENTORY_FULL_REFRESH_DEBOUNCE_MS = 5000;
const INVENTORY_REALTIME_STOCK_EVENT_TYPES = new Set([
  'STOCK_CHANGED',
  'PRODUCT_SOLD_OUT',
  'LOW_STOCK',
  'DAILY_CAPACITY_LOW',
]);

const INVENTORY_MODE_DEFAULT_MOTIVOS: Record<TipoManejoInventario, string> = {
  STOCK_EXACTO: 'Volver a stock exacto',
  CUPO_DIARIO: 'Cambiar a cupo diario',
  DISPONIBLE_NO_DISPONIBLE: 'Cambio de disponibilidad',
};

interface FilterOption {
  id: InventoryFilter;
  label: string;
}

interface InventoryModeOption {
  id: TipoManejoInventario;
  label: string;
}

type InventoryManagementField =
  | 'tipoManejoInventario'
  | 'stockActual'
  | 'stockMinimo'
  | 'cupoMaximoDiario';

type InventoryManagementShortcut = 'MAKE_AVAILABLE' | 'PAUSE' | 'SOLD_OUT';

@Component({
  selector: 'app-updated-inventory-page',
  standalone: true,
  imports: [
    NavbarComponent,
    ProductTableComponent,
    ProductFormComponent,
    ConfirmDeleteModalComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './updated-inventory-page.component.html',
  styleUrl: './updated-inventory-page.component.css',
})
export class UpdatedInventoryPageComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly inventoryRealtimeService = inject(InventoryRealtimeService);
  private readonly zone = inject(NgZone);
  private readonly fb = inject(FormBuilder);
  private readonly purchaseTotalFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  private readonly stockMovementDateFormatter = new Intl.DateTimeFormat(
    'es-AR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  );
  private readonly stockMovementNumberFormatter = new Intl.NumberFormat(
    'es-AR',
  );

  products: InventoryOverviewItem[] = [];
  categories: Category[] = [];
  isLoading = false;
  isRefreshing = false;
  isSaving = false;
  isFormVisible = false;
  selectedProduct: Product | null = null;
  deleteTarget: Product | null = null;
  activeFilter: InventoryFilter = 'TODOS';
  searchQuery = '';
  realtimeStatus: RealtimeStatus = 'disconnected';
  highlightedProductIds: ReadonlySet<string> = new Set<string>();
  stockMovementTarget: InventoryOverviewItem | null = null;
  stockMovements: InventoryStockMovement[] = [];
  isLoadingStockMovements = false;

  readonly filterOptions: FilterOption[] = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'DISPONIBLE', label: 'Disponibles' },
    { id: 'BAJO_STOCK', label: 'Bajo stock' },
    { id: 'ALTA_RESERVA', label: 'Alta reserva' },
    { id: 'PAUSADO', label: 'No disponibles' },
    { id: 'AGOTADO', label: 'Agotados' },
  ];

  readonly inventoryModeOptions: InventoryModeOption[] = [
    {
      id: 'STOCK_EXACTO',
      label: 'Stock exacto',
    },
    {
      id: 'CUPO_DIARIO',
      label: 'Cupo diario',
    },
    {
      id: 'DISPONIBLE_NO_DISPONIBLE',
      label: 'Disponible / No disponible',
    },
  ];

  readonly inventoryManagementForm = this.fb.group({
    tipoManejoInventario: [
      'STOCK_EXACTO' as TipoManejoInventario,
      [Validators.required],
    ],
    stockActual: [null as number | null, [Validators.min(0)]],
    stockMinimo: [null as number | null, [Validators.min(0)]],
    cupoMaximoDiario: [null as number | null, [Validators.min(0)]],
    disponible: [true],
    motivo: [''],
  });

  private buffetId: string | null = null;
  private realtimeAbortController: AbortController | null = null;
  private refreshTimeoutId: number | null = null;
  private readonly highlightTimeoutIds = new Map<string, number>();
  private inventoryManagementProductIdFromQuery: string | null = null;
  inventoryManagementTarget: InventoryOverviewItem | null = null;

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
  }

  ngOnInit(): void {
    this.buffetId = this.obtenerBuffetIdActual();
    this.inventoryManagementProductIdFromQuery =
      this.route.snapshot.queryParamMap.get('productId');
    this.loadCategories();
    this.loadProducts();

    if (this.buffetId) {
      this.connectRealtime(this.buffetId);
    }
  }

  ngOnDestroy(): void {
    this.realtimeAbortController?.abort();

    if (this.refreshTimeoutId !== null) {
      window.clearTimeout(this.refreshTimeoutId);
    }

    this.highlightTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.highlightTimeoutIds.clear();
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  get filteredProducts(): InventoryOverviewItem[] {
    const normalizedSearchQuery = this.normalizeSearchText(this.searchQuery);
    let products = normalizedSearchQuery
      ? this.products.filter((product) =>
          this.normalizeSearchText(product.nombre).includes(normalizedSearchQuery),
        )
      : this.products;

    if (this.activeFilter === 'DISPONIBLE') {
      products = products.filter((product) => this.isAvailableProduct(product));
    } else if (this.activeFilter === 'BAJO_STOCK') {
      products = products.filter(
        (product) => getOperationalStockStatus(product) === 'BAJO_STOCK',
      );
    } else if (this.activeFilter === 'ALTA_RESERVA') {
      products = products.filter(
        (product) => getOperationalStockStatus(product) === 'ALTA_RESERVA',
      );
    } else if (this.activeFilter === 'PAUSADO') {
      products = products.filter((product) => this.isPausedProduct(product));
    } else if (this.activeFilter === 'AGOTADO') {
      products = products.filter(
        (product) => getOperationalStockStatus(product) === 'AGOTADO',
      );
    }

    return [...products].sort(compareByOperationalStatus);
  }

  get disponiblesCount(): number {
    return this.products.filter((product) => this.isAvailableProduct(product)).length;
  }

  get bajoStockCount(): number {
    return this.products.filter(
      (product) => getOperationalStockStatus(product) === 'BAJO_STOCK',
    ).length;
  }

  get agotadosCount(): number {
    return this.products.filter(
      (product) => getOperationalStockStatus(product) === 'AGOTADO',
    ).length;
  }

  get pausadosCount(): number {
    return this.products.filter((product) => this.isPausedProduct(product)).length;
  }

  get altaReservaCount(): number {
    return this.products.filter(
      (product) => getOperationalStockStatus(product) === 'ALTA_RESERVA',
    ).length;
  }

  get reservadosCount(): number {
    return this.products.reduce(
      (total, product) => total + (product.stockReservado ?? 0),
      0,
    );
  }

  setFilter(filter: InventoryFilter): void {
    this.activeFilter = filter;
  }

  setSearchQuery(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchQuery = target?.value ?? '';
  }

  clearSearchQuery(): void {
    this.searchQuery = '';
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

  loadProducts(showLoading = true): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();
    if (!currentBuffetId) {
      this.products = [];
      this.isLoading = false;
      this.isRefreshing = false;
      this.toastService.mostrar('No se encontró un buffet asociado a tu perfil', 'error');
      return;
    }

    this.buffetId = currentBuffetId;

    if (showLoading) {
      this.isLoading = true;
    } else {
      this.isRefreshing = true;
    }

    this.productService.getInventoryOverview(currentBuffetId).subscribe({
      next: (data) => {
        this.products = data;
        this.openInventoryManagementFromQuery(data);
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: () => {
        this.toastService.mostrar('Error al cargar el inventario', 'error');
        this.isLoading = false;
        this.isRefreshing = false;
      },
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

  openEditFormFromInventory(product: InventoryOverviewItem): void {
    this.productService.getById(product.productId).subscribe({
      next: (fullProduct) => {
        this.openEditForm(this.normalizeEditableProduct(fullProduct));
      },
      error: () => {
        this.toastService.mostrar('Error al cargar el producto', 'error');
      },
    });
  }

  closeForm(): void {
    this.isFormVisible = false;
    this.selectedProduct = null;
  }

  handleFormSubmit(data: ProductFormData): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();
    if (!currentBuffetId) {
      this.isSaving = false;
      this.toastService.mostrar('No se encontró un buffet asociado a tu perfil', 'error');
      return;
    }

    this.isSaving = true;
    if (this.selectedProduct) {
      this.updateProduct(this.selectedProduct.id, data, currentBuffetId);
    } else {
      this.createProduct(data, currentBuffetId);
    }
  }

  requestDelete(product: Product): void {
    this.deleteTarget = product;
  }

  requestDeleteFromInventory(product: InventoryOverviewItem): void {
    this.deleteTarget = this.productFromInventoryOverview(product);
  }

  confirmDelete(): void {
    if (!this.deleteTarget) {
      return;
    }

    const id = this.deleteTarget.id;
    this.deleteTarget = null;

    this.productService.delete(id).subscribe({
      next: () => {
        this.products = this.products.filter((product) => product.productId !== id);
        this.toastService.mostrar('Producto eliminado correctamente', 'success');
      },
      error: () => {
        this.toastService.mostrar('Error al eliminar el producto', 'error');
      },
    });
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  openInventoryManagement(product: InventoryOverviewItem): void {
    this.inventoryManagementTarget = product;
    this.configureInventoryManagementForm(product);
  }

  closeInventoryManagement(): void {
    this.inventoryManagementTarget = null;
    this.inventoryManagementForm.reset({
      tipoManejoInventario: 'STOCK_EXACTO',
      stockActual: null,
      stockMinimo: null,
      cupoMaximoDiario: null,
      disponible: true,
      motivo: '',
    });
  }

  openStockHistory(product: InventoryOverviewItem): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();

    if (!currentBuffetId) {
      this.toastService.mostrar('No se encontró un buffet asociado a tu perfil', 'error');
      return;
    }

    this.buffetId = currentBuffetId;
    this.stockMovementTarget = product;
    this.stockMovements = [];
    this.isLoadingStockMovements = true;

    this.productService
      .getProductStockMovements(currentBuffetId, product.productId)
      .subscribe({
        next: (movements) => {
          if (this.stockMovementTarget?.productId !== product.productId) {
            return;
          }

          this.stockMovements = [...movements].sort(
            (first, second) =>
              new Date(second.creadoEn).getTime() -
              new Date(first.creadoEn).getTime(),
          );
          this.isLoadingStockMovements = false;
        },
        error: () => {
          if (this.stockMovementTarget?.productId !== product.productId) {
            return;
          }

          this.stockMovements = [];
          this.isLoadingStockMovements = false;
          this.toastService.mostrar(
            'No se pudo cargar el historial del producto',
            'error',
          );
        },
      });
  }

  closeStockHistory(): void {
    this.stockMovementTarget = null;
    this.stockMovements = [];
    this.isLoadingStockMovements = false;
  }

  getStockMovementTypeLabel(type: InventoryStockMovement['tipo']): string {
    const labels: Record<InventoryStockMovement['tipo'], string> = {
      RESERVA: 'Reserva',
      LIBERACION: 'Liberación',
      CONSUMO: 'Consumo',
      VENTA: 'Venta',
      AJUSTE: 'Ajuste',
    };

    return labels[type] ?? type;
  }

  getStockMovementTypeIcon(type: InventoryStockMovement['tipo']): string {
    const icons: Record<InventoryStockMovement['tipo'], string> = {
      RESERVA: 'fa-bookmark',
      LIBERACION: 'fa-lock-open',
      CONSUMO: 'fa-utensils',
      VENTA: 'fa-cash-register',
      AJUSTE: 'fa-sliders',
    };

    return icons[type] ?? 'fa-clock-rotate-left';
  }

  formatStockMovementDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return this.stockMovementDateFormatter.format(date);
  }

  formatStockMovementNumber(value: number | null | undefined): string {
    return this.stockMovementNumberFormatter.format(Number(value ?? 0));
  }

  formatStockMovementDelta(movement: InventoryStockMovement): string {
    const previous = Number(movement.cantidadAnterior);
    const next = Number(movement.cantidadNueva);

    if (!Number.isFinite(previous) || !Number.isFinite(next)) {
      return this.formatStockMovementNumber(movement.cantidad);
    }

    const delta = next - previous;

    if (delta > 0) {
      return `+${this.formatStockMovementNumber(delta)}`;
    }

    if (delta < 0) {
      return `-${this.formatStockMovementNumber(Math.abs(delta))}`;
    }

    return '0';
  }

  onInventoryModeChange(): void {
    this.updateInventoryManagementValidators();
    this.setDefaultInventoryManagementMotivo();
  }

  applyInventoryManagementShortcut(
    shortcut: InventoryManagementShortcut,
  ): void {
    if (shortcut === 'MAKE_AVAILABLE') {
      this.inventoryManagementForm.patchValue({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        motivo: 'Producto disponible',
      });
    }

    if (shortcut === 'PAUSE') {
      this.inventoryManagementForm.patchValue({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: false,
        motivo: 'Pausado temporalmente',
      });
    }

    if (shortcut === 'SOLD_OUT') {
      const currentMode = this.getInventoryManagementMode();

      if (currentMode === 'CUPO_DIARIO') {
        this.inventoryManagementForm.patchValue({
          cupoMaximoDiario: 0,
          disponible: true,
          motivo: 'Marcar agotado',
        });
      } else {
        const stockMinimo =
          this.inventoryManagementForm.controls.stockMinimo.value ??
          this.inventoryManagementTarget?.stockMinimo ??
          0;

        this.inventoryManagementForm.patchValue({
          tipoManejoInventario: 'STOCK_EXACTO',
          stockActual: 0,
          stockMinimo,
          disponible: true,
          motivo: 'Marcar agotado',
        });
      }
    }

    this.updateInventoryManagementValidators();
  }

  submitInventoryManagement(): void {
    if (!this.inventoryManagementTarget || !this.buffetId) {
      return;
    }

    this.updateInventoryManagementValidators();

    if (this.inventoryManagementForm.invalid) {
      this.inventoryManagementForm.markAllAsTouched();
      return;
    }

    const payload = this.buildInventoryStockPayload(
      this.inventoryManagementTarget,
    );

    this.isSaving = true;
    this.productService
      .updateInventoryStock(
        this.buffetId,
        this.inventoryManagementTarget.productId,
        payload,
      )
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.closeInventoryManagement();
          this.loadProducts(false);
          this.toastService.mostrar('Inventario actualizado', 'success');
        },
        error: (error) => {
          this.isSaving = false;
          this.toastService.mostrar(this.getInventoryErrorMessage(error), 'error');
        },
      });
  }

  hasInventoryManagementError(field: InventoryManagementField): boolean {
    const control = this.inventoryManagementForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getInventoryManagementMode(): TipoManejoInventario {
    return (
      this.inventoryManagementForm.controls.tipoManejoInventario.value ??
      'STOCK_EXACTO'
    );
  }

  private createProduct(data: ProductFormData, buffetId: string): void {
    const isNewCategory = data.categoriaId === 'NEW';
    const payload: CreateProductRequest = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      categoriaId: isNewCategory ? null : data.categoriaId,
      nuevaCategoriaNombre: isNewCategory ? data.nuevaCategoriaNombre : '',
      buffetId,
      stockActual: data.stockActual,
      clasificacionesSaludIds: buildHealthClassificationIds(data),
      tiposIds: null,
    };

    this.productService.create(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.loadProducts(false);
        this.toastService.mostrar('Producto creado exitosamente', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.toastService.mostrar('Error al crear el producto', 'error');
      },
    });
  }

  private updateProduct(id: string, data: ProductFormData, buffetId: string): void {
    const isNewCategory = data.categoriaId === 'NEW';
    const payload: UpdateProductRequest = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      stockActual: data.stockActual,
      buffetId,
      categoriaId: isNewCategory ? '' : (data.categoriaId || ''),
      clasificacionesSaludIds: buildHealthClassificationIds(data),
    };

    this.productService.update(id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.loadProducts(false);
        this.toastService.mostrar('Producto actualizado exitosamente', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.toastService.mostrar('Error al actualizar el producto', 'error');
      },
    });
  }

  private openInventoryManagementFromQuery(
    products: InventoryOverviewItem[],
  ): void {
    const productId = this.inventoryManagementProductIdFromQuery?.trim();
    if (!productId || this.inventoryManagementTarget) {
      return;
    }

    const product = products.find((item) => item.productId === productId);
    if (!product) {
      return;
    }

    this.openInventoryManagement(product);
    this.inventoryManagementProductIdFromQuery = null;
    this.highlightProduct(product.productId);
  }

  private configureInventoryManagementForm(product: InventoryOverviewItem): void {
    this.inventoryManagementForm.reset({
      tipoManejoInventario: product.tipoManejoInventario,
      stockActual: product.stockActual,
      stockMinimo: product.stockMinimo,
      cupoMaximoDiario: product.cupoMaximoDiario,
      disponible: product.disponible,
      motivo: this.getDefaultInventoryManagementMotivo(
        product.tipoManejoInventario,
        product.disponible,
      ),
    });
    this.updateInventoryManagementValidators(product);
  }

  private updateInventoryManagementValidators(
    product = this.inventoryManagementTarget,
  ): void {
    const mode = this.getInventoryManagementMode();
    const stockActualControl = this.inventoryManagementForm.controls.stockActual;
    const stockMinimoControl = this.inventoryManagementForm.controls.stockMinimo;
    const cupoMaximoDiarioControl =
      this.inventoryManagementForm.controls.cupoMaximoDiario;

    stockActualControl.setValidators([
      Validators.min(0),
      ...(mode === 'STOCK_EXACTO' && !this.hasStoredNumber(product?.stockActual)
        ? [Validators.required]
        : []),
    ]);
    stockMinimoControl.setValidators([
      Validators.min(0),
      ...(mode === 'STOCK_EXACTO' && !this.hasStoredNumber(product?.stockMinimo)
        ? [Validators.required]
        : []),
    ]);
    cupoMaximoDiarioControl.setValidators([
      Validators.min(0),
      ...(mode === 'CUPO_DIARIO' &&
      !this.hasStoredNumber(product?.cupoMaximoDiario)
        ? [Validators.required]
        : []),
    ]);

    stockActualControl.updateValueAndValidity();
    stockMinimoControl.updateValueAndValidity();
    cupoMaximoDiarioControl.updateValueAndValidity();
  }

  private buildInventoryStockPayload(
    product: InventoryOverviewItem,
  ): InventoryStockUpdateRequest {
    const rawValue = this.inventoryManagementForm.getRawValue();
    const mode = rawValue.tipoManejoInventario ?? 'STOCK_EXACTO';
    const disponible = rawValue.disponible === true;
    const payload: InventoryStockUpdateRequest = {
      tipoManejoInventario: mode,
      motivo:
        rawValue.motivo?.trim() ||
        this.getDefaultInventoryManagementMotivo(mode, disponible),
    };

    if (mode === 'DISPONIBLE_NO_DISPONIBLE') {
      payload.disponible = disponible;
      payload.estadoInventario = disponible ? 'DISPONIBLE' : 'DESACTIVADO';
    }

    if (mode === 'STOCK_EXACTO') {
      payload.disponible = true;
      payload.estadoInventario = this.resolveStockExactStatus(product);

      const stockActual = this.toOptionalNumber(rawValue.stockActual);
      const stockMinimo = this.toOptionalNumber(rawValue.stockMinimo);

      if (stockActual !== undefined) {
        payload.stockActual = stockActual;
      }

      if (stockMinimo !== undefined) {
        payload.stockMinimo = stockMinimo;
      }
    }

    if (mode === 'CUPO_DIARIO') {
      payload.disponible = true;
      payload.estadoInventario = this.resolveDailyCapacityStatus(product);

      const cupoMaximoDiario = this.toOptionalNumber(
        rawValue.cupoMaximoDiario,
      );

      if (cupoMaximoDiario !== undefined) {
        payload.cupoMaximoDiario = cupoMaximoDiario;
      }
    }

    const usuarioId = this.obtenerUsuarioIdActual();
    if (usuarioId) {
      payload.usuarioId = usuarioId;
    }

    return payload;
  }

  private resolveStockExactStatus(
    product: InventoryOverviewItem,
  ): EstadoInventario {
    const stockActual =
      this.toOptionalNumber(
        this.inventoryManagementForm.controls.stockActual.value,
      ) ?? product.stockActual;
    const stockMinimo =
      this.toOptionalNumber(
        this.inventoryManagementForm.controls.stockMinimo.value,
      ) ?? product.stockMinimo;

    if (stockActual !== null && stockActual !== undefined && stockActual <= 0) {
      return 'SIN_STOCK';
    }

    if (
      stockActual !== null &&
      stockActual !== undefined &&
      stockMinimo !== null &&
      stockMinimo !== undefined &&
      stockActual <= stockMinimo
    ) {
      return 'BAJO_STOCK';
    }

    return 'DISPONIBLE';
  }

  private resolveDailyCapacityStatus(
    product: InventoryOverviewItem,
  ): EstadoInventario {
    const cupoMaximoDiario =
      this.toOptionalNumber(
        this.inventoryManagementForm.controls.cupoMaximoDiario.value,
      ) ?? product.cupoMaximoDiario;

    return cupoMaximoDiario !== null &&
      cupoMaximoDiario !== undefined &&
      cupoMaximoDiario <= 0
      ? 'SIN_STOCK'
      : 'DISPONIBLE';
  }

  private getDefaultInventoryManagementMotivo(
    mode: TipoManejoInventario,
    disponible: boolean,
  ): string {
    if (mode === 'DISPONIBLE_NO_DISPONIBLE') {
      return disponible ? 'Producto disponible' : 'Pausado temporalmente';
    }

    return INVENTORY_MODE_DEFAULT_MOTIVOS[mode];
  }

  private setDefaultInventoryManagementMotivo(): void {
    const motivoControl = this.inventoryManagementForm.controls.motivo;
    const currentMotivo = motivoControl.value?.trim();

    if (currentMotivo && !this.isDefaultInventoryManagementMotivo(currentMotivo)) {
      return;
    }

    motivoControl.setValue(
      this.getDefaultInventoryManagementMotivo(
        this.getInventoryManagementMode(),
        this.inventoryManagementForm.controls.disponible.value === true,
      ),
    );
  }

  private isDefaultInventoryManagementMotivo(value: string): boolean {
    return [
      ...Object.values(INVENTORY_MODE_DEFAULT_MOTIVOS),
      'Producto disponible',
      'Pausado temporalmente',
      'Marcar agotado',
    ].includes(value);
  }

  private hasStoredNumber(value: number | null | undefined): boolean {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private toOptionalNumber(
    value: number | string | null | undefined,
  ): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  private getInventoryErrorMessage(error: unknown): string {
    const responseError =
      error instanceof HttpErrorResponse && typeof error.error === 'object'
        ? error.error
        : null;
    const code =
      responseError && 'code' in responseError && typeof responseError.code === 'string'
        ? responseError.code
        : null;

    if (code && INVENTORY_ERROR_MESSAGES[code]) {
      return INVENTORY_ERROR_MESSAGES[code];
    }

    if (
      responseError &&
      'mensaje' in responseError &&
      typeof responseError.mensaje === 'string'
    ) {
      return responseError.mensaje;
    }

    return 'No se pudo actualizar el inventario.';
  }

  private connectRealtime(buffetId: string): void {
    this.realtimeAbortController?.abort();
    this.realtimeStatus = 'connecting';

    this.realtimeAbortController = this.inventoryRealtimeService.connect(buffetId, {
      onOpen: () => {
        this.zone.run(() => {
          this.realtimeStatus = 'connected';
        });
      },
      onClose: () => {
        this.zone.run(() => {
          this.realtimeStatus = 'disconnected';
        });
      },
      onRefresh: (event) => {
        this.zone.run(() => {
          if (!INVENTORY_REALTIME_STOCK_EVENT_TYPES.has(event.type)) {
            return;
          }

          const shouldRefreshInventory = this.applyRealtimeInventoryEvent(event);
          this.highlightProduct(event.productId);

          if (shouldRefreshInventory) {
            this.scheduleInventoryRefresh();
          }
        });
      },
      onPurchaseCreated: (event) => {
        this.zone.run(() => this.showPurchaseCreatedToast(event));
      },
      onError: (error) => {
        console.warn('SSE de inventario desconectado o reintentando', error);
        this.zone.run(() => {
          this.realtimeStatus = 'disconnected';
        });
      },
    });
  }

  private showPurchaseCreatedToast(event: RealtimeInventoryEvent): void {
    const message = event.message?.trim() || 'Pedido realizado';
    const total = this.formatPurchaseTotal(event.purchaseTotal);
    const toastMessage = total ? `${message} - Total: ${total}` : message;

    this.toastService.mostrar(toastMessage, 'success');
  }

  private formatPurchaseTotal(total: unknown): string | null {
    if (total === null || total === undefined || total === '') {
      return null;
    }

    const numericTotal = Number(total);
    if (!Number.isFinite(numericTotal)) {
      return null;
    }

    return this.purchaseTotalFormatter.format(numericTotal);
  }

  private scheduleInventoryRefresh(): void {
    if (this.refreshTimeoutId !== null) {
      return;
    }

    this.refreshTimeoutId = window.setTimeout(() => {
      this.refreshTimeoutId = null;
      this.inventoryRealtimeService.recordRefetch('inventory-overview');
      this.loadProducts(false);
    }, INVENTORY_FULL_REFRESH_DEBOUNCE_MS);
  }

  private applyRealtimeInventoryEvent(event: RealtimeInventoryEvent): boolean {
    const productId = event.productId?.trim();

    if (!productId) {
      return true;
    }

    let updatedProduct: InventoryOverviewItem | null = null;
    let previousProduct: InventoryOverviewItem | null = null;

    this.products = this.products.map((product) => {
      if (product.productId !== productId) {
        return product;
      }

      previousProduct = product;
      updatedProduct = this.mergeRealtimeInventoryEvent(product, event);
      return updatedProduct;
    });

    if (!updatedProduct) {
      return true;
    }

    if (this.inventoryManagementTarget?.productId === productId) {
      this.inventoryManagementTarget = updatedProduct;
    }

    if (this.stockMovementTarget?.productId === productId) {
      this.stockMovementTarget = updatedProduct;
    }

    return this.shouldRefreshInventoryAfterRealtimeEvent(
      event,
      previousProduct,
    );
  }

  private mergeRealtimeInventoryEvent(
    product: InventoryOverviewItem,
    event: RealtimeInventoryEvent,
  ): InventoryOverviewItem {
    const estadoInventario = this.resolveRealtimeInventoryStatus(
      product,
      event,
    );

    return {
      ...product,
      tipoManejoInventario:
        event.tipoManejoInventario ?? product.tipoManejoInventario,
      estadoInventario,
      stockActual: event.stockActual ?? product.stockActual,
      stockReservado: event.stockReservado ?? product.stockReservado,
      stockDisponible: event.stockDisponible ?? product.stockDisponible,
      stockMinimo: event.stockMinimo ?? product.stockMinimo,
      cupoMaximoDiario:
        event.cupoMaximoDiario ?? product.cupoMaximoDiario,
      cupoDisponibleDia:
        event.cupoDisponibleDia ?? product.cupoDisponibleDia,
      disponible: event.disponible ?? estadoInventario !== 'DESACTIVADO',
      bajoStock: estadoInventario === 'BAJO_STOCK',
      agotado: estadoInventario === 'SIN_STOCK',
    };
  }

  private resolveRealtimeInventoryStatus(
    product: InventoryOverviewItem,
    event: RealtimeInventoryEvent,
  ): EstadoInventario {
    if (event.estadoInventario) {
      return event.estadoInventario;
    }

    if (event.type === 'PRODUCT_SOLD_OUT') {
      return 'SIN_STOCK';
    }

    if (event.type === 'LOW_STOCK' || event.type === 'DAILY_CAPACITY_LOW') {
      return 'BAJO_STOCK';
    }

    return product.estadoInventario;
  }

  private shouldRefreshInventoryAfterRealtimeEvent(
    event: RealtimeInventoryEvent,
    product: InventoryOverviewItem | null,
  ): boolean {
    if (!product) {
      return true;
    }

    if (!this.hasRealtimeInventoryState(event)) {
      return true;
    }

    return (
      this.isInventoryConfigurationEvent(event) &&
      !this.hasRealtimeConfigurationState(event)
    );
  }

  private hasRealtimeInventoryState(event: RealtimeInventoryEvent): boolean {
    return (
      event.stockActual !== undefined ||
      event.stockReservado !== undefined ||
      event.stockDisponible !== undefined ||
      event.stockMinimo !== undefined ||
      event.cupoMaximoDiario !== undefined ||
      event.cupoDisponibleDia !== undefined ||
      event.disponible !== undefined ||
      event.estadoInventario !== undefined ||
      event.tipoManejoInventario !== undefined
    );
  }

  private isInventoryConfigurationEvent(event: RealtimeInventoryEvent): boolean {
    const normalizedText = this.normalizeSearchText(
      [
        event.message,
        event.movementType,
        event.changeKind,
        event.reason,
      ].join(' '),
    );

    return [
      'minimo',
      'cupo',
      'modo',
      'manejo',
      'capacidad',
      'disponibilidad',
      'disponible',
    ].some((keyword) => normalizedText.includes(keyword));
  }

  private hasRealtimeConfigurationState(event: RealtimeInventoryEvent): boolean {
    return (
      event.tipoManejoInventario !== undefined ||
      event.stockMinimo !== undefined ||
      event.cupoMaximoDiario !== undefined ||
      event.cupoDisponibleDia !== undefined ||
      event.disponible !== undefined ||
      event.estadoInventario !== undefined
    );
  }

  private highlightProduct(productId: string | undefined): void {
    const normalizedProductId = productId?.trim();
    if (!normalizedProductId) {
      return;
    }

    const previousTimeoutId = this.highlightTimeoutIds.get(normalizedProductId);
    if (previousTimeoutId !== undefined) {
      window.clearTimeout(previousTimeoutId);
    }

    this.highlightedProductIds = new Set([
      ...this.highlightedProductIds,
      normalizedProductId,
    ]);

    const timeoutId = window.setTimeout(() => {
      const nextHighlightedProductIds = new Set(this.highlightedProductIds);
      nextHighlightedProductIds.delete(normalizedProductId);
      this.highlightedProductIds = nextHighlightedProductIds;
      this.highlightTimeoutIds.delete(normalizedProductId);
    }, PRODUCT_HIGHLIGHT_DURATION_MS);

    this.highlightTimeoutIds.set(normalizedProductId, timeoutId);
  }

  private normalizeSearchText(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('es-AR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private normalizeEditableProduct(product: Product): Product {
    return {
      ...product,
      categoriaId: product.categoriaId ?? product.categoria?.id ?? null,
      categoriaNombre:
        product.categoriaNombre ?? product.categoria?.descripcion ?? '',
    };
  }

  private productFromInventoryOverview(product: InventoryOverviewItem): Product {
    return {
      id: product.productId,
      nombre: product.nombre,
      descripcion: '',
      precio: product.precio,
      peso: 0,
      requierePreparacion: false,
      stockActual: product.stockActual ?? 0,
    };
  }

  private obtenerBuffetIdActual(): string | null {
    return this.perfilService.obtenerBuffetId();
  }

  private obtenerUsuarioIdActual(): string | undefined {
    const usuarioId = this.perfilService.getPerfil()?.id?.trim();
    return usuarioId && usuarioId.length > 0 ? usuarioId : undefined;
  }

  private isPausedProduct(product: InventoryOverviewItem): boolean {
    return getOperationalStockStatus(product) === 'PAUSADO';
  }

  private isAvailableProduct(product: InventoryOverviewItem): boolean {
    const status = getOperationalStockStatus(product);
    return product.disponible && status !== 'AGOTADO' && status !== 'PAUSADO';
  }
}
