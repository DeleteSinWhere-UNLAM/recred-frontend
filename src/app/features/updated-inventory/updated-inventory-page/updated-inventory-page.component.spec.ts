import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UpdatedInventoryPageComponent } from './updated-inventory-page.component';
import { ProductService } from '../services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { InventoryRealtimeService } from '../services/inventory-realtime.service';
import { Category } from '../models/category.interface';
import { Product } from '../models/product.interface';
import {
  InventoryOverviewItem,
  InventoryStockMovement,
  RealtimeInventoryEvent,
} from '../models/inventory.interface';
import { ProductFormData } from '../components/product-form/product-form.component';

describe('UpdatedInventoryPageComponent', () => {
  let component: UpdatedInventoryPageComponent;
  let fixture: ComponentFixture<UpdatedInventoryPageComponent>;
  let productServiceMock: jasmine.SpyObj<ProductService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let perfilServiceMock: jasmine.SpyObj<PerfilService>;
  let realtimeServiceMock: jasmine.SpyObj<InventoryRealtimeService>;
  let activatedRouteMock: {
    snapshot: {
      queryParamMap: ReturnType<typeof convertToParamMap>;
    };
  };

  const mockBuffetId = 'buffet-test-123';

  const mockCategories: Category[] = [
    { id: 'c1', descripcion: 'Category 1', activo: true },
    { id: 'c2', descripcion: 'Category 2', activo: true },
  ];

  const mockInventory: InventoryOverviewItem[] = [
    {
      productId: '1',
      nombre: 'Alfajor',
      precio: 1200,
      tipoManejoInventario: 'STOCK_EXACTO',
      estadoInventario: 'DISPONIBLE',
      stockActual: 20,
      stockReservado: 3,
      stockDisponible: 17,
      stockMinimo: 5,
      cupoMaximoDiario: null,
      cupoDisponibleDia: null,
      disponible: true,
      bajoStock: false,
      agotado: false,
    },
    {
      productId: '2',
      nombre: 'Sandwich',
      precio: 2500,
      tipoManejoInventario: 'CUPO_DIARIO',
      estadoInventario: 'BAJO_STOCK',
      stockActual: 4,
      stockReservado: 1,
      stockDisponible: 3,
      stockMinimo: null,
      cupoMaximoDiario: 30,
      cupoDisponibleDia: 3,
      disponible: true,
      bajoStock: true,
      agotado: false,
    },
  ];

  const createdProduct: Product = {
    id: 'new-id',
    nombre: 'New Product',
    descripcion: 'New Desc',
    precio: 100,
    peso: 1,
    requierePreparacion: false,
    stockActual: 10,
    categoriaId: 'c1',
  };

  const mockStockMovements: InventoryStockMovement[] = [
    {
      id: 'movement-old',
      inventarioId: 'inventory-1',
      tipo: 'VENTA',
      cantidad: 2,
      cantidadAnterior: 10,
      cantidadNueva: 8,
      motivo: 'Consumo por venta presencial',
      usuarioId: 'usuario-1',
      compraId: 'compra-1',
      creadoEn: '2026-06-11T10:30:00',
    },
    {
      id: 'movement-new',
      inventarioId: 'inventory-1',
      tipo: 'AJUSTE',
      cantidad: 5,
      cantidadAnterior: 8,
      cantidadNueva: 13,
      motivo: 'Reposición manual',
      usuarioId: 'usuario-1',
      compraId: null,
      creadoEn: '2026-06-11T11:30:00',
    },
  ];

  beforeEach(async () => {
    productServiceMock = jasmine.createSpyObj('ProductService', [
      'getCategories',
      'getInventoryOverview',
      'updateInventoryStock',
      'getProductStockMovements',
      'create',
    ]);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['mostrar']);
    perfilServiceMock = jasmine.createSpyObj('PerfilService', [
      'obtenerBuffetId',
      'getPerfil',
    ]);
    realtimeServiceMock = jasmine.createSpyObj('InventoryRealtimeService', [
      'connect',
      'recordRefetch',
    ]);

    productServiceMock.getCategories.and.returnValue(of(mockCategories));
    productServiceMock.getInventoryOverview.and.returnValue(of(mockInventory));
    productServiceMock.updateInventoryStock.and.returnValue(of({ ok: true }));
    productServiceMock.getProductStockMovements.and.returnValue(
      of(mockStockMovements),
    );
    productServiceMock.create.and.returnValue(of(createdProduct));
    perfilServiceMock.obtenerBuffetId.and.returnValue(mockBuffetId);
    perfilServiceMock.getPerfil.and.returnValue(null);
    realtimeServiceMock.connect.and.returnValue(new AbortController());
    activatedRouteMock = {
      snapshot: {
        queryParamMap: convertToParamMap({}),
      },
    };

    await TestBed.configureTestingModule({
      imports: [UpdatedInventoryPageComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: PerfilService, useValue: perfilServiceMock },
        { provide: InventoryRealtimeService, useValue: realtimeServiceMock },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdatedInventoryPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deberia cargar categorias, overview e iniciar SSE al iniciar', () => {
    fixture.detectChanges();

    expect(productServiceMock.getCategories).toHaveBeenCalled();
    expect(productServiceMock.getInventoryOverview).toHaveBeenCalledWith(mockBuffetId);
    expect(realtimeServiceMock.connect).toHaveBeenCalled();
    expect(component.categories).toEqual(mockCategories);
    expect(component.products).toEqual(mockInventory);
  });

  it('deberia abrir el modal de gestion cuando llega productId por query param', () => {
    activatedRouteMock.snapshot.queryParamMap = convertToParamMap({
      productId: mockInventory[1].productId,
    });

    fixture.detectChanges();

    expect(component.inventoryManagementTarget).toEqual(mockInventory[1]);
    expect(component.getInventoryManagementMode()).toBe('CUPO_DIARIO');
    expect(component.highlightedProductIds.has(mockInventory[1].productId)).toBeTrue();
  });

  it('deberia mostrar toast cuando llega una compra nueva por SSE', () => {
    fixture.detectChanges();
    const handlers = realtimeServiceMock.connect.calls.mostRecent().args[1] as {
      onPurchaseCreated: (event: {
        buffetId: string;
        type: string;
        occurredAt: string;
        message?: string;
        purchaseTotal?: number;
      }) => void;
    };
    const formattedTotal = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(2500);

    handlers.onPurchaseCreated({
      buffetId: mockBuffetId,
      type: 'PURCHASE_CREATED',
      occurredAt: new Date().toISOString(),
      message: 'Pedido realizado',
      purchaseTotal: 2500,
    });

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith(
      `Pedido realizado - Total: ${formattedTotal}`,
      'success',
    );
  });

  it('deberia mostrar error si falla la carga de inventario', () => {
    productServiceMock.getInventoryOverview.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    fixture.detectChanges();

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith(
      'Error al cargar el inventario',
      'error',
    );
    expect(component.isLoading).toBeFalse();
  });

  it('deberia filtrar productos con bajo stock', () => {
    component.products = mockInventory;

    component.setFilter('BAJO_STOCK');

    expect(component.filteredProducts).toEqual([mockInventory[1]]);
  });

  it('deberia filtrar productos por busqueda de nombre', () => {
    component.products = mockInventory;
    component.searchQuery = 'alfa';

    expect(component.filteredProducts).toEqual([mockInventory[0]]);
  });

  it('deberia combinar busqueda de nombre con filtro de estado', () => {
    component.products = mockInventory;
    component.searchQuery = 'sand';
    component.setFilter('BAJO_STOCK');

    expect(component.filteredProducts).toEqual([mockInventory[1]]);
  });

  it('deberia filtrar productos con alta reserva', () => {
    const highReservationProduct: InventoryOverviewItem = {
      ...mockInventory[0],
      productId: 'alta-reserva',
      stockDisponible: 3,
      stockReservado: 4,
    };
    const products: InventoryOverviewItem[] = [
      mockInventory[0],
      highReservationProduct,
    ];
    component.products = products;

    component.setFilter('ALTA_RESERVA');

    expect(component.filteredProducts).toEqual([highReservationProduct]);
  });

  it('deberia filtrar productos no disponibles', () => {
    const pausedProduct: InventoryOverviewItem = {
      ...mockInventory[0],
      productId: 'pausado',
      nombre: 'Producto no disponible',
      estadoInventario: 'DESACTIVADO',
      disponible: false,
      agotado: false,
    };
    component.products = [...mockInventory, pausedProduct];

    component.setFilter('PAUSADO');

    expect(component.filteredProducts).toEqual([pausedProduct]);
    expect(component.pausadosCount).toBe(1);
  });

  it('deberia calcular disponibles y reservados', () => {
    component.products = mockInventory;

    expect(component.disponiblesCount).toBe(2);
    expect(component.reservadosCount).toBe(4);
    expect(component.altaReservaCount).toBe(0);
  });

  it('deberia resaltar temporalmente el producto actualizado por SSE', fakeAsync(() => {
    fixture.detectChanges();
    const handlers = realtimeServiceMock.connect.calls.mostRecent().args[1] as {
      onRefresh: (event: RealtimeInventoryEvent) => void;
    };

    handlers.onRefresh({
      buffetId: mockBuffetId,
      type: 'STOCK_CHANGED',
      productId: mockInventory[0].productId,
      stockActual: 18,
      stockReservado: 3,
      stockDisponible: 15,
      estadoInventario: 'DISPONIBLE',
      tipoManejoInventario: 'STOCK_EXACTO',
      occurredAt: new Date().toISOString(),
    });

    expect(component.highlightedProductIds.has(mockInventory[0].productId)).toBeTrue();

    tick(3000);

    expect(component.highlightedProductIds.has(mockInventory[0].productId)).toBeFalse();
  }));

  it('deberia inicializar selectedProduct a null y mostrar el formulario de alta', () => {
    component.openCreateForm();

    expect(component.selectedProduct).toBeNull();
    expect(component.isFormVisible).toBeTrue();
  });

  it('deberia crear producto y refrescar overview', () => {
    spyOn(component, 'loadProducts');
    const formData: ProductFormData = {
      nombre: 'New Product',
      descripcion: 'New Desc',
      precio: 100,
      peso: 1,
      stockActual: 10,
      categoriaId: 'c1',
      nuevaCategoriaNombre: '',
      requierePreparacion: false,
      contiene_azucar: false,
      contiene_mani: false,
      contiene_lactosa: false,
      contiene_tacc: false,
    };

    fixture.detectChanges();
    component.handleFormSubmit(formData);

    expect(productServiceMock.create).toHaveBeenCalled();
    expect(productServiceMock.create.calls.mostRecent().args[0].buffetId).toBe(mockBuffetId);
    expect(component.loadProducts).toHaveBeenCalledWith(false);
    expect(toastServiceMock.mostrar).toHaveBeenCalledWith(
      'Producto creado exitosamente',
      'success',
    );
  });

  it('deberia cargar el historial de stock del producto', () => {
    fixture.detectChanges();

    component.openStockHistory(mockInventory[0]);

    expect(productServiceMock.getProductStockMovements).toHaveBeenCalledWith(
      mockBuffetId,
      mockInventory[0].productId,
    );
    expect(component.stockMovementTarget).toEqual(mockInventory[0]);
    expect(component.stockMovements.map((movement) => movement.id)).toEqual([
      'movement-new',
      'movement-old',
    ]);
    expect(component.isLoadingStockMovements).toBeFalse();
  });

  it('deberia cerrar el historial de stock', () => {
    fixture.detectChanges();
    component.openStockHistory(mockInventory[0]);

    component.closeStockHistory();

    expect(component.stockMovementTarget).toBeNull();
    expect(component.stockMovements).toEqual([]);
    expect(component.isLoadingStockMovements).toBeFalse();
  });

  it('deberia mostrar error si falla la carga del historial', () => {
    productServiceMock.getProductStockMovements.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    fixture.detectChanges();
    component.openStockHistory(mockInventory[0]);

    expect(component.stockMovements).toEqual([]);
    expect(component.isLoadingStockMovements).toBeFalse();
    expect(toastServiceMock.mostrar).toHaveBeenCalledWith(
      'No se pudo cargar el historial del producto',
      'error',
    );
  });

  it('deberia gestionar modo stock exacto reutilizando valores existentes', () => {
    perfilServiceMock.getPerfil.and.returnValue({
      id: 'usuario-123',
      email: 'test@example.com',
      nombre: 'Test',
      apellido: 'User',
      rol: 'VENDEDOR',
    });

    const pausedProduct: InventoryOverviewItem = {
      ...mockInventory[0],
      tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
      estadoInventario: 'DESACTIVADO',
      disponible: false,
      stockActual: 15,
      stockMinimo: 5,
    };

    fixture.detectChanges();
    component.openInventoryManagement(pausedProduct);
    component.inventoryManagementForm.patchValue({
      tipoManejoInventario: 'STOCK_EXACTO',
      motivo: '',
    });

    component.submitInventoryManagement();

    expect(productServiceMock.updateInventoryStock).toHaveBeenCalledWith(
      mockBuffetId,
      pausedProduct.productId,
      {
        tipoManejoInventario: 'STOCK_EXACTO',
        disponible: true,
        estadoInventario: 'DISPONIBLE',
        stockActual: 15,
        stockMinimo: 5,
        motivo: 'Volver a stock exacto',
        usuarioId: 'usuario-123',
      },
    );
    expect(toastServiceMock.mostrar).toHaveBeenCalledWith(
      'Inventario actualizado',
      'success',
    );
  });

  it('deberia aplicar el atajo de pausar dentro del modal de gestion', () => {
    fixture.detectChanges();
    component.openInventoryManagement(mockInventory[0]);

    component.applyInventoryManagementShortcut('PAUSE');
    component.submitInventoryManagement();

    expect(productServiceMock.updateInventoryStock).toHaveBeenCalledWith(
      mockBuffetId,
      mockInventory[0].productId,
      {
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: false,
        estadoInventario: 'DESACTIVADO',
        motivo: 'Pausado temporalmente',
      },
    );
  });

  it('deberia cambiar a disponible/no disponible sin pisar stock', () => {
    fixture.detectChanges();
    component.openInventoryManagement(mockInventory[0]);
    component.inventoryManagementForm.patchValue({
      tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
      disponible: false,
      motivo: 'Pausado temporalmente',
    });

    component.submitInventoryManagement();

    expect(productServiceMock.updateInventoryStock).toHaveBeenCalledWith(
      mockBuffetId,
      mockInventory[0].productId,
      {
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: false,
        estadoInventario: 'DESACTIVADO',
        motivo: 'Pausado temporalmente',
      },
    );
  });

  it('deberia aplicar el atajo disponible con usuarioId', () => {
    perfilServiceMock.getPerfil.and.returnValue({
      id: 'usuario-123',
      email: 'test@example.com',
      nombre: 'Test',
      apellido: 'User',
      rol: 'VENDEDOR',
    });

    fixture.detectChanges();
    component.openInventoryManagement({
      ...mockInventory[0],
      estadoInventario: 'DESACTIVADO',
      disponible: false,
    });
    component.applyInventoryManagementShortcut('MAKE_AVAILABLE');

    component.submitInventoryManagement();

    expect(productServiceMock.updateInventoryStock).toHaveBeenCalledWith(
      mockBuffetId,
      mockInventory[0].productId,
      {
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: true,
        estadoInventario: 'DISPONIBLE',
        motivo: 'Producto disponible',
        usuarioId: 'usuario-123',
      },
    );
  });

  it('deberia aplicar el atajo de agotar stock exacto', () => {
    fixture.detectChanges();
    component.openInventoryManagement(mockInventory[0]);

    component.applyInventoryManagementShortcut('SOLD_OUT');
    component.submitInventoryManagement();

    expect(productServiceMock.updateInventoryStock).toHaveBeenCalledWith(
      mockBuffetId,
      mockInventory[0].productId,
      {
        tipoManejoInventario: 'STOCK_EXACTO',
        disponible: true,
        estadoInventario: 'SIN_STOCK',
        stockActual: 0,
        stockMinimo: 5,
        motivo: 'Marcar agotado',
      },
    );
  });

  it('deberia aplicar el atajo de agotar cupo diario', () => {
    fixture.detectChanges();
    component.openInventoryManagement(mockInventory[1]);

    component.applyInventoryManagementShortcut('SOLD_OUT');
    component.submitInventoryManagement();

    expect(productServiceMock.updateInventoryStock).toHaveBeenCalledWith(
      mockBuffetId,
      mockInventory[1].productId,
      {
        tipoManejoInventario: 'CUPO_DIARIO',
        disponible: true,
        estadoInventario: 'SIN_STOCK',
        cupoMaximoDiario: 0,
        motivo: 'Marcar agotado',
      },
    );
  });

  it('deberia mapear errores de gestion por code', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        code: 'STOCK_INSUFFICIENT',
        mensaje: 'No hay stock suficiente...',
      },
    });
    productServiceMock.updateInventoryStock.and.returnValue(throwError(() => error));

    fixture.detectChanges();
    component.openInventoryManagement(mockInventory[0]);
    component.inventoryManagementForm.patchValue({ stockActual: 0 });
    component.submitInventoryManagement();

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith(
      'No hay stock suficiente.',
      'error',
    );
  });
});
