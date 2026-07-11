import { HttpErrorResponse } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from '../services/producto.service';
import { Producto } from '../models/producto.interface';
import { SolicitudCrearProducto } from '../models/requests/crear-producto-request.interface';
import { SolicitudActualizarProducto } from '../models/requests/actualizar-producto-request.interface';
import { Categoria } from '../models/categoria.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TablaProductoComponent } from '../components/tabla-producto/tabla-producto.component';
import { FormularioProductoComponent, DatosFormularioProducto, DatosInicialesProducto } from '../components/formulario-producto/formulario-producto.component';
import { ModalConfirmarEliminarComponent } from '../components/modal-confirmar-eliminar/modal-confirmar-eliminar.component';
import { InventarioRealtimeService } from '../services/inventario-realtime.service';
import {
  EstadoInventario,
  ItemResumenInventario,
  MovimientoStockInventario,
  SolicitudActualizarStockInventario,
  EventoInventarioRealtime,
  TipoManejoInventario,
} from '../models/inventario.interface';
import {
  compararPorEstadoOperativo,
  getEstadoOperativoStock,
} from '../models/estado-visual-inventario';
import {
  ClasificacionSaludBackend,
  RestriccionesNutricionalesService,
} from '../../restricciones-nutricionales/services/restricciones-nutricionales.service';
import { ordenarClasificacionesSalud } from '../../restricciones-nutricionales/models/restricciones-nutricionales.model';

function buildHealthClassificationIds(data: DatosFormularioProducto): string[] {
  return data.clasificacionesSaludIds ?? [];
}

const MENSAJES_ERROR_INVENTARIO: Record<string, string> = {
  STOCK_INSUFFICIENT: 'No hay stock suficiente.',
  INVENTORY_OPERATION_INVALID: 'La operaciÃ³n de inventario no es vÃ¡lida para este producto.',
  PRODUCT_DAILY_CAPACITY_EXCEEDED: 'El cupo diario de este producto estÃ¡ agotado.',
  FORBIDDEN: 'No tenÃ©s permisos sobre este buffet.',
  NOT_FOUND: 'No se encontrÃ³ el producto o inventario.',
  BAD_REQUEST: 'Revisa los datos ingresados.',
};

type FiltroInventario =
  | 'TODOS'
  | 'DISPONIBLE'
  | 'BAJO_STOCK'
  | 'ALTA_RESERVA'
  | 'PAUSADO'
  | 'AGOTADO';
type EstadoRealtime = 'connecting' | 'connected' | 'disconnected';

const INVENTORY_FULL_REFRESH_DEBOUNCE_MS = 5000;

const MOTIVOS_DEFAULT_MODO_INVENTARIO: Record<TipoManejoInventario, string> = {
  STOCK_EXACTO: 'Volver a stock exacto',
  CUPO_DIARIO: 'Cambiar a cupo diario',
  DISPONIBLE_NO_DISPONIBLE: 'Cambio de disponibilidad',
};

interface OpcionFiltro {
  id: FiltroInventario;
  label: string;
}

interface OpcionModoInventario {
  id: TipoManejoInventario;
  label: string;
}

type CampoGestionInventario =
  | 'tipoManejoInventario'
  | 'stockActual'
  | 'stockMinimo'
  | 'cupoMaximoDiario';

type AtajoGestionInventario = 'MAKE_AVAILABLE' | 'PAUSE' | 'SOLD_OUT';

@Component({
  selector: 'app-updated-inventory-page',
  standalone: true,
  imports: [
    NavbarComponent,
    TablaProductoComponent,
    FormularioProductoComponent,
    ModalConfirmarEliminarComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './inventario-page.component.html',
  styleUrl: './inventario-page.component.css',
})
export class InventarioPageComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly inventoryRealtimeService = inject(InventarioRealtimeService);
  private readonly restriccionesNutricionalesService = inject(RestriccionesNutricionalesService);
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

  products: ItemResumenInventario[] = [];
  categories: Categoria[] = [];
  healthClassifications: ClasificacionSaludBackend[] = [];
  isLoading = false;
  isRefreshing = false;
  isSaving = false;
  isFormVisible = false;
  datosInicialesProducto: DatosInicialesProducto | null = null;
  selectedProduct: Producto | null = null;
  deleteTarget: Producto | null = null;
  activeFilter: FiltroInventario = 'TODOS';
  searchQuery = '';
  realtimeStatus: EstadoRealtime = 'disconnected';
  highlightedProductIds: ReadonlySet<string> = new Set<string>();
  stockMovementTarget: ItemResumenInventario | null = null;
  stockMovements: MovimientoStockInventario[] = [];
  isLoadingStockMovements = false;

  readonly filterOptions: OpcionFiltro[] = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'DISPONIBLE', label: 'Disponibles' },
    { id: 'BAJO_STOCK', label: 'Bajo stock' },
    { id: 'ALTA_RESERVA', label: 'Alta reserva' },
    { id: 'PAUSADO', label: 'No disponibles' },
    { id: 'AGOTADO', label: 'Agotados' },
  ];

  readonly inventoryModeOptions: OpcionModoInventario[] = [
    {
      id: 'STOCK_EXACTO',
      label: 'Control por unidades',
    },
    {
      id: 'CUPO_DIARIO',
      label: 'Límite diario de venta',
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
    estadoInventario: [null as EstadoInventario | null],
    motivo: [''],
  });

  buffetId: string | null = null;
  private realtimeAbortController: AbortController | null = null;
  private refreshTimeoutId: number | null = null;
  private readonly highlightTimeoutIds = new Map<string, number>();
  private inventoryManagementProductIdFromQuery: string | null = null;
  inventoryManagementTarget: ItemResumenInventario | null = null;

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
  }

  ngOnInit(): void {
    this.buffetId = this.obtenerBuffetIdActual();
    this.inventoryManagementProductIdFromQuery =
      this.route.snapshot.queryParamMap.get('productId');
    this.abrirAltaProductoDesdeQuery();
    this.loadCategories();
    this.loadHealthClassifications();
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

  irAComparador(): void {
    this.router.navigate(['/kiosquero/proveedores/comparador'], {
      queryParams: { preselect: 'low-stock' }
    });
  }

  get filteredProducts(): ItemResumenInventario[] {
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
        (product) => getEstadoOperativoStock(product) === 'BAJO_STOCK',
      );
    } else if (this.activeFilter === 'ALTA_RESERVA') {
      products = products.filter(
        (product) => getEstadoOperativoStock(product) === 'ALTA_RESERVA',
      );
    } else if (this.activeFilter === 'PAUSADO') {
      products = products.filter((product) => this.isPausedProduct(product));
    } else if (this.activeFilter === 'AGOTADO') {
      products = products.filter(
        (product) => getEstadoOperativoStock(product) === 'AGOTADO',
      );
    }

    return [...products].sort(compararPorEstadoOperativo);
  }

  get disponiblesCount(): number {
    return this.products.filter((product) => this.isAvailableProduct(product)).length;
  }

  get bajoStockCount(): number {
    return this.products.filter(
      (product) => getEstadoOperativoStock(product) === 'BAJO_STOCK',
    ).length;
  }

  get agotadosCount(): number {
    return this.products.filter(
      (product) => getEstadoOperativoStock(product) === 'AGOTADO',
    ).length;
  }

  get pausadosCount(): number {
    return this.products.filter((product) => this.isPausedProduct(product)).length;
  }

  get altaReservaCount(): number {
    return this.products.filter(
      (product) => getEstadoOperativoStock(product) === 'ALTA_RESERVA',
    ).length;
  }

  get reservadosCount(): number {
    return this.products.reduce(
      (total, product) => total + (product.stockReservado ?? 0),
      0,
    );
  }

  setFilter(filter: FiltroInventario): void {
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
        this.toastService.mostrar('Error al cargar las categorÃ­as', 'error');
      },
    });
  }

  loadHealthClassifications(): void {
    this.restriccionesNutricionalesService
      .getCatalogo()
      .then((catalogo) => {
        this.healthClassifications = ordenarClasificacionesSalud(catalogo);
      })
      .catch(() => {
        this.healthClassifications = [];
        this.toastService.mostrar('Error al cargar las clasificaciones de salud', 'error');
      });
  }

  loadProducts(showLoading = true): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();
    if (!currentBuffetId) {
      this.products = [];
      this.isLoading = false;
      this.isRefreshing = false;
      this.toastService.mostrar('No se encontrÃ³ un buffet asociado a tu perfil', 'error');
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
    this.openIndividualForm();
  }

  openIndividualForm(): void {
    this.selectedProduct = null;
    this.datosInicialesProducto = null;
    this.isFormVisible = true;
  }

  openEditForm(product: Producto): void {
    this.selectedProduct = product;
    this.datosInicialesProducto = null;
    this.isFormVisible = true;
  }

  openEditFormFromInventory(product: ItemResumenInventario): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();
    if (!currentBuffetId) {
      this.toastService.mostrar('No se encontrÃƒÂ³ un buffet asociado a tu perfil', 'error');
      return;
    }

    this.productService.getById(product.productId, currentBuffetId).subscribe({
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
    this.datosInicialesProducto = null;
  }

  handleFormSubmit(data: DatosFormularioProducto): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();
    if (!currentBuffetId) {
      this.isSaving = false;
      this.toastService.mostrar('No se encontrÃ³ un buffet asociado a tu perfil', 'error');
      return;
    }

    this.isSaving = true;
    if (this.selectedProduct) {
      this.updateProduct(this.selectedProduct.id, data, currentBuffetId);
    } else {
      this.createProduct(data, currentBuffetId);
    }
  }

  requestDelete(product: Producto): void {
    this.deleteTarget = product;
  }

  requestDeleteFromInventory(product: ItemResumenInventario): void {
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

  openInventoryManagement(product: ItemResumenInventario): void {
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

  openStockHistory(product: ItemResumenInventario): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();

    if (!currentBuffetId) {
      this.toastService.mostrar('No se encontrÃ³ un buffet asociado a tu perfil', 'error');
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

  getStockMovementTypeLabel(type: MovimientoStockInventario['tipo']): string {
    const labels: Record<MovimientoStockInventario['tipo'], string> = {
      RESERVA: 'Reserva',
      LIBERACION: 'Liberación',
      CONSUMO: 'Consumo',
      VENTA: 'Venta',
      AJUSTE: 'Ajuste',
    };

    return labels[type] ?? type;
  }

  getStockMovementTypeIcon(type: MovimientoStockInventario['tipo']): string {
    const icons: Record<MovimientoStockInventario['tipo'], string> = {
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

  formatStockMovementDelta(movement: MovimientoStockInventario): string {
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
    const mode = this.getInventoryManagementMode();
    const defaultMotivo = MOTIVOS_DEFAULT_MODO_INVENTARIO[mode] || '';

    const patchValues: {
      motivo: string;
      disponible?: boolean;
      estadoInventario?: EstadoInventario | null;
    } = { motivo: defaultMotivo };

    if (mode === 'STOCK_EXACTO') {
      patchValues.disponible = true;
      patchValues.estadoInventario = 'DISPONIBLE';
    }

    this.inventoryManagementForm.patchValue(patchValues);
  }

  applyInventoryManagementShortcut(
    shortcut: AtajoGestionInventario,
  ): void {
    if (shortcut === 'MAKE_AVAILABLE') {
      this.inventoryManagementForm.patchValue({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        estadoInventario: 'DISPONIBLE',
        motivo: 'Producto disponible',
      });
    }

    if (shortcut === 'PAUSE') {
      this.inventoryManagementForm.patchValue({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: false,
        estadoInventario: 'DESACTIVADO',
        motivo: 'Pausado temporalmente',
      });
    }

    if (shortcut === 'SOLD_OUT') {
      const currentMode = this.getInventoryManagementMode();

      if (currentMode === 'CUPO_DIARIO') {
        this.inventoryManagementForm.patchValue({
          cupoMaximoDiario: 0,
          disponible: true,
          estadoInventario: 'SIN_STOCK',
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
          estadoInventario: 'SIN_STOCK',
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

    const values = this.inventoryManagementForm.value;
    if (values.tipoManejoInventario === 'DISPONIBLE_NO_DISPONIBLE') {
      const targetEstado = values.disponible ? 'DISPONIBLE' : 'DESACTIVADO';
      if (values.estadoInventario !== targetEstado) {
        this.inventoryManagementForm.patchValue({ estadoInventario: targetEstado });
      }
    }

    if (this.inventoryManagementForm.invalid) {
      this.inventoryManagementForm.markAllAsTouched();
      return;
    }

    const payload = this.buildInventoryStockPayload();

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

  hasInventoryManagementError(field: CampoGestionInventario): boolean {
    const control = this.inventoryManagementForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getInventoryManagementMode(): TipoManejoInventario {
    return (
      this.inventoryManagementForm.controls.tipoManejoInventario.value ??
      'STOCK_EXACTO'
    );
  }

  private createProduct(data: DatosFormularioProducto, buffetId: string): void {
    const isNewCategory = data.categoriaId === "NEW";
    const payload: SolicitudCrearProducto = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      categoriaId: isNewCategory ? null : data.categoriaId,
      nuevaCategoriaNombre: isNewCategory ? data.nuevaCategoriaNombre : "",
      buffetId,
      stockActual: data.stockActual,
      clasificacionesSaludIds: buildHealthClassificationIds(data),
      tiposIds: null,
      urlImagen: data.urlImagen
    };

    this.productService.create(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.loadProducts(false);
        this.toastService.mostrar("Producto creado exitosamente", "success");
      },
      error: () => {
        this.isSaving = false;
        this.toastService.mostrar("Error al crear el producto", "error");
      },
    });
  }

  private updateProduct(id: string, data: DatosFormularioProducto, buffetId: string): void {
    const isNewCategory = data.categoriaId === "NEW";
    const payload: SolicitudActualizarProducto = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      peso: data.peso,
      requierePreparacion: data.requierePreparacion,
      stockActual: data.stockActual,
      buffetId,
      categoriaId: isNewCategory ? "" : (data.categoriaId || ""),
      clasificacionesSaludIds: buildHealthClassificationIds(data),
      urlImagen: data.urlImagen
    };

    this.productService.update(id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.loadProducts(false);
        this.toastService.mostrar("Producto actualizado exitosamente", "success");
      },
      error: () => {
        this.isSaving = false;
        this.toastService.mostrar("Error al actualizar el producto", "error");
      },
    });
  }

  private productFromInventoryOverview(product: ItemResumenInventario): Producto {
    return {
      id: product.productId,
      nombre: product.nombre,
      descripcion: "",
      precio: product.precio,
      peso: 0,
      requierePreparacion: false,
      stockActual: product.stockActual ?? 0,
      urlImagen: product.urlImagen
    };
  }

  private obtenerBuffetIdActual(): string | null {
    return this.perfilService.obtenerBuffetId();
  }

  private obtenerUsuarioIdActual(): string | undefined {
    const usuarioId = this.perfilService.getPerfil()?.id?.trim();
    return usuarioId && usuarioId.length > 0 ? usuarioId : undefined;
  }

  private isPausedProduct(product: ItemResumenInventario): boolean {
    return getEstadoOperativoStock(product) === 'PAUSADO';
  }

  private isAvailableProduct(product: ItemResumenInventario): boolean {
    const status = getEstadoOperativoStock(product);
    return product.disponible && status !== 'AGOTADO' && status !== 'PAUSADO';
  }

  private connectRealtime(buffetId: string): void {
    this.realtimeAbortController?.abort();

    this.realtimeAbortController = this.inventoryRealtimeService.connect(
      buffetId,
      {
        onRefresh: (event) => {
          this.zone.run(() => this.scheduleRealtimeRefresh(event));
        },
        onPurchaseCreated: (event) => {
          this.zone.run(() => {
            const total = event.purchaseTotal
              ? ` - Total: ${this.purchaseTotalFormatter.format(event.purchaseTotal)}`
              : '';
            this.toastService.mostrar(`${event.message || 'Nueva compra'}${total}`, 'success');
          });
        },
        onError: (error) => {
          console.warn('SSE de inventario desconectado o reintentando', error);
        },
      },
    );
  }

  private scheduleRealtimeRefresh(event: EventoInventarioRealtime): void {
    if (event.productId) {
      const productId = event.productId;
      const newHighlighted = new Set(this.highlightedProductIds);
      newHighlighted.add(productId);
      this.highlightedProductIds = newHighlighted;

      if (this.highlightTimeoutIds.has(productId)) {
        window.clearTimeout(this.highlightTimeoutIds.get(productId));
      }

      const timeoutId = window.setTimeout(() => {
        const currentHighlighted = new Set(this.highlightedProductIds);
        currentHighlighted.delete(productId);
        this.highlightedProductIds = currentHighlighted;
        this.highlightTimeoutIds.delete(productId);
      }, 3000);

      this.highlightTimeoutIds.set(productId, timeoutId);
    }

    if (this.refreshTimeoutId !== null) {
      return;
    }

    this.refreshTimeoutId = window.setTimeout(() => {
      this.refreshTimeoutId = null;
      this.loadProducts(false);
    }, INVENTORY_FULL_REFRESH_DEBOUNCE_MS);
  }

  private normalizeSearchText(text: string): string {
    return (text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private highlightProduct(productId: string): void {
    const newHighlighted = new Set(this.highlightedProductIds);
    newHighlighted.add(productId);
    this.highlightedProductIds = newHighlighted;

    if (this.highlightTimeoutIds.has(productId)) {
      window.clearTimeout(this.highlightTimeoutIds.get(productId));
    }

    const timeoutId = window.setTimeout(() => {
      const currentHighlighted = new Set(this.highlightedProductIds);
      currentHighlighted.delete(productId);
      this.highlightedProductIds = currentHighlighted;
      this.highlightTimeoutIds.delete(productId);
    }, 3000);

    this.highlightTimeoutIds.set(productId, timeoutId);
  }

  private openInventoryManagementFromQuery(data: ItemResumenInventario[]): void {
    if (!this.inventoryManagementProductIdFromQuery) {
      return;
    }

    const product = data.find(
      (p) => p.productId === this.inventoryManagementProductIdFromQuery,
    );

    if (product) {
      this.openInventoryManagement(product);
      this.highlightProduct(product.productId);
    }

    this.router.navigate([], {
      queryParams: { productId: null },
      queryParamsHandling: 'merge',
    });
    this.inventoryManagementProductIdFromQuery = null;
  }

  private abrirAltaProductoDesdeQuery(): void {
    const nombreProducto = this.route.snapshot.queryParamMap.get('nombreProducto');
    if (!nombreProducto) {
      return;
    }

    const precioProducto = Number(this.route.snapshot.queryParamMap.get('precioProducto') ?? 0);
    this.selectedProduct = null;
    this.datosInicialesProducto = {
      nombre: nombreProducto,
      descripcion: 'Producto sugerido para incorporar al stock.',
      precio: Number.isFinite(precioProducto) ? precioProducto : 0,
      peso: 0,
      stockActual: 0,
    };
    this.isFormVisible = true;

    this.router.navigate([], {
      queryParams: {
        origen: null,
        nombreProducto: null,
        precioProducto: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private normalizeEditableProduct(product: Producto): Producto {
    return {
      ...product,
      precio: Number(product.precio),
      peso: Number(product.peso),
      stockActual: Number(product.stockActual),
    };
  }

  private configureInventoryManagementForm(product: ItemResumenInventario): void {
    this.inventoryManagementForm.reset({
      tipoManejoInventario: product.tipoManejoInventario,
      stockActual: product.stockActual,
      stockMinimo: product.stockMinimo,
      cupoMaximoDiario: product.cupoMaximoDiario,
      disponible: product.disponible,
      estadoInventario: product.estadoInventario,
      motivo: '',
    });
    this.updateInventoryManagementValidators();
  }

  private updateInventoryManagementValidators(): void {
    const mode = this.getInventoryManagementMode();
    const { stockActual, stockMinimo, cupoMaximoDiario } =
      this.inventoryManagementForm.controls;

    stockActual.clearValidators();
    stockMinimo.clearValidators();
    cupoMaximoDiario.clearValidators();

    if (mode === 'STOCK_EXACTO') {
      stockActual.setValidators([Validators.required, Validators.min(0)]);
      stockMinimo.setValidators([Validators.required, Validators.min(0)]);
    } else if (mode === 'CUPO_DIARIO') {
      cupoMaximoDiario.setValidators([Validators.required, Validators.min(0)]);
    }

    stockActual.updateValueAndValidity();
    stockMinimo.updateValueAndValidity();
    cupoMaximoDiario.updateValueAndValidity();
  }

  private setDefaultInventoryManagementMotivo(): void {
    const mode = this.getInventoryManagementMode();
    const defaultMotivo = MOTIVOS_DEFAULT_MODO_INVENTARIO[mode] || '';
    this.inventoryManagementForm.patchValue({ motivo: defaultMotivo });
  }

  private buildInventoryStockPayload(): SolicitudActualizarStockInventario {
    const values = this.inventoryManagementForm.value;
    const mode = values.tipoManejoInventario as TipoManejoInventario;

    const payload: SolicitudActualizarStockInventario = {
      tipoManejoInventario: mode,
      disponible: !!values.disponible,
      motivo: values.motivo || 'Actualización manual',
    };

    const usuarioId = this.obtenerUsuarioIdActual();
    if (usuarioId) {
      payload.usuarioId = usuarioId;
    }

    if (values.estadoInventario) {
      payload.estadoInventario = values.estadoInventario as EstadoInventario;
    } else if (mode === 'DISPONIBLE_NO_DISPONIBLE') {
      payload.estadoInventario = values.disponible ? 'DISPONIBLE' : 'DESACTIVADO';
    }

    if (mode === 'STOCK_EXACTO') {
      payload.stockActual = values.stockActual ?? 0;
      payload.stockMinimo = values.stockMinimo ?? 0;
    } else if (mode === 'CUPO_DIARIO') {
      payload.cupoMaximoDiario = values.cupoMaximoDiario ?? 0;
    }

    return payload;
  }

  private getInventoryErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const code = error.error?.code || error.statusText;
      if (code && MENSAJES_ERROR_INVENTARIO[code]) {
        return MENSAJES_ERROR_INVENTARIO[code];
      }

      if (error.status === 403) return MENSAJES_ERROR_INVENTARIO['FORBIDDEN'];
      if (error.status === 404) return MENSAJES_ERROR_INVENTARIO['NOT_FOUND'];
      if (error.status === 400) return MENSAJES_ERROR_INVENTARIO['BAD_REQUEST'];
    }

    return 'Ocurrió un error inesperado al actualizar el inventario.';
  }
}














