import { HttpErrorResponse } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CreateProductRequest, Product } from '../models/product.interface';
import { Category } from '../models/category.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ProductTableComponent, QuickStockActionSelection } from '../components/product-table/product-table.component';
import { ProductFormComponent, ProductFormData } from '../components/product-form/product-form.component';
import { InventoryRealtimeService } from '../services/inventory-realtime.service';
import {
  InventoryOverviewItem,
  QuickStockAction,
  QuickStockActionRequest,
  RealtimeInventoryEvent,
} from '../models/inventory.interface';

const HEALTH_CLASSIFICATION_IDS = ['15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8'];

const INVENTORY_ERROR_MESSAGES: Record<string, string> = {
  STOCK_INSUFFICIENT: 'No hay stock suficiente.',
  INVENTORY_OPERATION_INVALID: 'La operacion de inventario no es valida para este producto.',
  PRODUCT_DAILY_CAPACITY_EXCEEDED: 'El cupo diario de este producto esta agotado.',
  FORBIDDEN: 'No tenes permisos sobre este buffet.',
  NOT_FOUND: 'No se encontro el producto o inventario.',
  BAD_REQUEST: 'Revisa los datos ingresados.',
};

type InventoryFilter = 'TODOS' | 'DISPONIBLE' | 'RESERVADO' | 'BAJO_STOCK' | 'AGOTADO';
type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

interface FilterOption {
  id: InventoryFilter;
  label: string;
}

interface QuickActionTarget {
  product: InventoryOverviewItem;
  action: QuickStockAction;
}

@Component({
  selector: 'app-updated-inventory-page',
  standalone: true,
  imports: [
    NavbarComponent,
    ProductTableComponent,
    ProductFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './updated-inventory-page.component.html',
  styleUrl: './updated-inventory-page.component.css',
})
export class UpdatedInventoryPageComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly inventoryRealtimeService = inject(InventoryRealtimeService);
  private readonly zone = inject(NgZone);
  private readonly fb = inject(FormBuilder);
  private readonly purchaseTotalFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  products: InventoryOverviewItem[] = [];
  categories: Category[] = [];
  isLoading = false;
  isRefreshing = false;
  isSaving = false;
  isFormVisible = false;
  selectedProduct: Product | null = null;
  activeFilter: InventoryFilter = 'TODOS';
  realtimeStatus: RealtimeStatus = 'disconnected';
  quickActionTarget: QuickActionTarget | null = null;

  readonly filterOptions: FilterOption[] = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'DISPONIBLE', label: 'Disponibles' },
    { id: 'RESERVADO', label: 'Reservados' },
    { id: 'BAJO_STOCK', label: 'Bajo stock' },
    { id: 'AGOTADO', label: 'Agotados' },
  ];

  readonly quickActionForm = this.fb.group({
    quantity: [null as number | null],
    stockMinimo: [null as number | null, [Validators.min(0)]],
    motivo: [''],
  });

  private buffetId: string | null = null;
  private realtimeAbortController: AbortController | null = null;
  private refreshTimeoutId: number | null = null;

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
  }

  ngOnInit(): void {
    this.buffetId = this.obtenerBuffetIdActual();
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
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  get filteredProducts(): InventoryOverviewItem[] {
    if (this.activeFilter === 'DISPONIBLE') {
      return this.products.filter((product) => product.disponible && !product.agotado);
    }

    if (this.activeFilter === 'BAJO_STOCK') {
      return this.products.filter((product) => product.bajoStock);
    }

    if (this.activeFilter === 'RESERVADO') {
      return this.products.filter((product) => (product.stockReservado ?? 0) > 0);
    }

    if (this.activeFilter === 'AGOTADO') {
      return this.products.filter((product) => product.agotado);
    }

    return this.products;
  }

  get disponiblesCount(): number {
    return this.products.filter((product) => product.disponible && !product.agotado).length;
  }

  get bajoStockCount(): number {
    return this.products.filter((product) => product.bajoStock).length;
  }

  get agotadosCount(): number {
    return this.products.filter((product) => product.agotado).length;
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

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: () => {
        this.toastService.mostrar('Error al cargar las categorias', 'error');
      },
    });
  }

  loadProducts(showLoading = true): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();
    if (!currentBuffetId) {
      this.products = [];
      this.isLoading = false;
      this.isRefreshing = false;
      this.toastService.mostrar('No se encontro un buffet asociado a tu perfil', 'error');
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

  closeForm(): void {
    this.isFormVisible = false;
    this.selectedProduct = null;
  }

  handleFormSubmit(data: ProductFormData): void {
    const currentBuffetId = this.buffetId ?? this.obtenerBuffetIdActual();
    if (!currentBuffetId) {
      this.isSaving = false;
      this.toastService.mostrar('No se encontro un buffet asociado a tu perfil', 'error');
      return;
    }

    this.isSaving = true;
    this.createProduct(data, currentBuffetId);
  }

  openQuickAction(selection: QuickStockActionSelection): void {
    this.quickActionTarget = selection;
    this.configureQuickActionForm(selection.action, selection.product);
  }

  closeQuickAction(): void {
    this.quickActionTarget = null;
    this.quickActionForm.reset({
      quantity: null,
      stockMinimo: null,
      motivo: '',
    });
  }

  submitQuickAction(): void {
    if (!this.quickActionTarget || !this.buffetId) {
      return;
    }

    if (this.quickActionForm.invalid) {
      this.quickActionForm.markAllAsTouched();
      return;
    }

    const payload = this.buildQuickActionPayload(this.quickActionTarget.action);

    this.isSaving = true;
    this.productService
      .quickStockAction(
        this.buffetId,
        this.quickActionTarget.product.productId,
        payload,
      )
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.closeQuickAction();
          this.loadProducts(false);
          this.toastService.mostrar('Inventario actualizado', 'success');
        },
        error: (error) => {
          this.isSaving = false;
          this.toastService.mostrar(this.getInventoryErrorMessage(error), 'error');
        },
      });
  }

  requiresQuantity(action: QuickStockAction): boolean {
    return [
      'SET_STOCK',
      'ADD_STOCK',
      'SUBTRACT_STOCK',
      'SET_DAILY_CAPACITY',
    ].includes(action);
  }

  isSetStockAction(action: QuickStockAction): boolean {
    return action === 'SET_STOCK';
  }

  getQuickActionTitle(action: QuickStockAction): string {
    const labels: Record<QuickStockAction, string> = {
      SET_STOCK: 'Definir stock',
      ADD_STOCK: 'Agregar stock',
      SUBTRACT_STOCK: 'Restar stock',
      MARK_SOLD_OUT: 'Marcar agotado',
      SET_AVAILABLE: 'Activar producto',
      SET_UNAVAILABLE: 'Pausar producto',
      SET_DAILY_CAPACITY: 'Definir cupo diario',
    };

    return labels[action];
  }

  getQuantityLabel(action: QuickStockAction): string {
    if (action === 'SET_DAILY_CAPACITY') {
      return 'Cupo diario';
    }

    if (action === 'ADD_STOCK') {
      return 'Cantidad a agregar';
    }

    if (action === 'SUBTRACT_STOCK') {
      return 'Cantidad a restar';
    }

    return 'Stock';
  }

  hasQuickActionError(field: 'quantity' | 'stockMinimo'): boolean {
    const control = this.quickActionForm.get(field);
    return !!(control && control.invalid && control.touched);
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
      clasificacionesSaludIds: HEALTH_CLASSIFICATION_IDS,
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

  private configureQuickActionForm(
    action: QuickStockAction,
    product: InventoryOverviewItem,
  ): void {
    const quantityControl = this.quickActionForm.get('quantity');
    const minQuantity = action === 'ADD_STOCK' || action === 'SUBTRACT_STOCK' ? 1 : 0;

    if (this.requiresQuantity(action)) {
      quantityControl?.setValidators([Validators.required, Validators.min(minQuantity)]);
    } else {
      quantityControl?.clearValidators();
    }

    const initialQuantity =
      action === 'SET_STOCK'
        ? product.stockActual
        : action === 'SET_DAILY_CAPACITY'
          ? product.cupoMaximoDiario
          : null;

    this.quickActionForm.reset({
      quantity: initialQuantity,
      stockMinimo: action === 'SET_STOCK' ? product.stockMinimo : null,
      motivo: '',
    });
    quantityControl?.updateValueAndValidity();
  }

  private buildQuickActionPayload(action: QuickStockAction): QuickStockActionRequest {
    const rawValue = this.quickActionForm.getRawValue();
    const payload: QuickStockActionRequest = { action };

    if (this.requiresQuantity(action) && rawValue.quantity !== null) {
      payload.quantity = Number(rawValue.quantity);
    }

    if (action === 'SET_STOCK' && rawValue.stockMinimo !== null) {
      payload.stockMinimo = Number(rawValue.stockMinimo);
    }

    const motivo = rawValue.motivo?.trim();
    if (motivo) {
      payload.motivo = motivo;
    }

    return payload;
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
      onRefresh: () => {
        this.zone.run(() => this.scheduleInventoryRefresh());
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
      this.loadProducts(false);
    }, 250);
  }

  private obtenerBuffetIdActual(): string | null {
    return this.perfilService.obtenerBuffetId();
  }
}
