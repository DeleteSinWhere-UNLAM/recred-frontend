import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UpdatedInventoryPageComponent } from './updated-inventory-page.component';
import { ProductService } from '../services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { InventoryRealtimeService } from '../services/inventory-realtime.service';
import { Category } from '../models/category.interface';
import { Product } from '../models/product.interface';
import { InventoryOverviewItem } from '../models/inventory.interface';
import { ProductFormData } from '../components/product-form/product-form.component';

describe('UpdatedInventoryPageComponent', () => {
  let component: UpdatedInventoryPageComponent;
  let fixture: ComponentFixture<UpdatedInventoryPageComponent>;
  let productServiceMock: jasmine.SpyObj<ProductService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let perfilServiceMock: jasmine.SpyObj<PerfilService>;
  let realtimeServiceMock: jasmine.SpyObj<InventoryRealtimeService>;

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

  beforeEach(async () => {
    productServiceMock = jasmine.createSpyObj('ProductService', [
      'getCategories',
      'getInventoryOverview',
      'quickStockAction',
      'create',
    ]);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['mostrar']);
    perfilServiceMock = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    realtimeServiceMock = jasmine.createSpyObj('InventoryRealtimeService', ['connect']);

    productServiceMock.getCategories.and.returnValue(of(mockCategories));
    productServiceMock.getInventoryOverview.and.returnValue(of(mockInventory));
    productServiceMock.quickStockAction.and.returnValue(of({ ok: true }));
    productServiceMock.create.and.returnValue(of(createdProduct));
    perfilServiceMock.obtenerBuffetId.and.returnValue(mockBuffetId);
    realtimeServiceMock.connect.and.returnValue(new AbortController());

    await TestBed.configureTestingModule({
      imports: [UpdatedInventoryPageComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: PerfilService, useValue: perfilServiceMock },
        { provide: InventoryRealtimeService, useValue: realtimeServiceMock },
        provideRouter([]),
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

  it('deberia calcular disponibles y reservados', () => {
    component.products = mockInventory;

    expect(component.disponiblesCount).toBe(2);
    expect(component.reservadosCount).toBe(4);
    expect(component.altaReservaCount).toBe(0);
  });

  it('deberia resaltar temporalmente el producto actualizado por SSE', fakeAsync(() => {
    fixture.detectChanges();
    const handlers = realtimeServiceMock.connect.calls.mostRecent().args[1] as {
      onRefresh: (event: {
        buffetId: string;
        type: string;
        productId?: string;
        occurredAt: string;
      }) => void;
    };

    handlers.onRefresh({
      buffetId: mockBuffetId,
      type: 'STOCK_CHANGED',
      productId: mockInventory[0].productId,
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

  it('deberia abrir y enviar quick action', () => {
    fixture.detectChanges();
    component.openQuickAction({
      product: mockInventory[0],
      action: 'ADD_STOCK',
    });
    component.quickActionForm.patchValue({
      quantity: 10,
      motivo: 'Reposicion',
    });

    component.submitQuickAction();

    expect(productServiceMock.quickStockAction).toHaveBeenCalledWith(
      mockBuffetId,
      mockInventory[0].productId,
      {
        action: 'ADD_STOCK',
        quantity: 10,
        motivo: 'Reposicion',
      },
    );
    expect(toastServiceMock.mostrar).toHaveBeenCalledWith(
      'Inventario actualizado',
      'success',
    );
  });

  it('deberia mapear errores de quick action por code', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        code: 'STOCK_INSUFFICIENT',
        mensaje: 'No hay stock suficiente...',
      },
    });
    productServiceMock.quickStockAction.and.returnValue(throwError(() => error));

    fixture.detectChanges();
    component.openQuickAction({
      product: mockInventory[0],
      action: 'SUBTRACT_STOCK',
    });
    component.quickActionForm.patchValue({ quantity: 30 });
    component.submitQuickAction();

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith(
      'No hay stock suficiente.',
      'error',
    );
  });
});
