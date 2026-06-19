import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ProductService } from './product.service';
import { Product } from '../models/product.interface';
import { CreateProductRequest } from '../models/requests/create-product-request.interface';
import { UpdateProductRequest } from '../models/requests/update-product-request.interface';
import { Category } from '../models/category.interface';
import {
  InventoryOverviewItem,
  InventoryStockMovement,
  InventoryStockUpdateRequest,
  QuickStockActionRequest,
} from '../models/inventory.interface';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const productsUrl = `${environment.apiUrl}/products`;
  const categoriesUrl = `${environment.apiUrl}/categories`;
  const inventoryUrl = `${environment.apiUrl}/inventory`;

  const mockProducts: Product[] = [
    {
      id: '1',
      nombre: 'Product 1',
      descripcion: 'Desc 1',
      precio: 100,
      peso: 1,
      requierePreparacion: false,
      stockActual: 10,
      categoriaId: 'c1',
    },
    {
      id: '2',
      nombre: 'Product 2',
      descripcion: 'Desc 2',
      precio: 200,
      peso: 2,
      requierePreparacion: true,
      stockActual: 20,
      categoriaId: 'c2',
    },
  ];

  const mockCategories: Category[] = [
    { id: 'c1', descripcion: 'Category 1', activo: true },
    { id: 'c2', descripcion: 'Category 2', activo: true },
  ];

  const mockOverview: InventoryOverviewItem[] = [
    {
      productId: '1',
      nombre: 'Product 1',
      precio: 100,
      tipoManejoInventario: 'STOCK_EXACTO',
      estadoInventario: 'DISPONIBLE',
      stockActual: 10,
      stockReservado: 2,
      stockDisponible: 8,
      stockMinimo: 3,
      cupoMaximoDiario: null,
      cupoDisponibleDia: null,
      disponible: true,
      bajoStock: false,
      agotado: false,
    },
  ];

  const mockMovements: InventoryStockMovement[] = [
    {
      id: 'movement-1',
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
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que llamo a getAll, deberia retornar un arreglo de productos', () => {
    service.getAll().subscribe((products) => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne(productsUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('dado que llamo a getCategories, deberia retornar categorias', () => {
    service.getCategories().subscribe((categories) => {
      expect(categories).toEqual(mockCategories);
    });

    const req = httpMock.expectOne(categoriesUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
  });

  it('dado que llamo a getAllByBuffetId, deberia enviar buffetId como parametro', () => {
    const buffetId = 'test-buffet-123';

    service.getAllByBuffetId(buffetId).subscribe((products) => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne(
      (request) => request.url === productsUrl && request.params.get('buffetId') === buffetId,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('dado que consulto el inventory, deberia obtener el overview por buffet', () => {
    const buffetId = 'test-buffet-123';

    service.getInventoryOverview(buffetId).subscribe((overview) => {
      expect(overview).toEqual(mockOverview);
    });

    const req = httpMock.expectOne(`${inventoryUrl}/${buffetId}/overview`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOverview);
  });

  it('dado que envio accion rapida, deberia actualizar el inventario', () => {
    const buffetId = 'test-buffet-123';
    const productId = 'product-123';
    const payload: QuickStockActionRequest = {
      action: 'ADD_STOCK',
      quantity: 10,
      motivo: 'Reposicion',
    };

    service.quickStockAction(buffetId, productId, payload).subscribe((response) => {
      expect(response).toEqual({ ok: true });
    });

    const req = httpMock.expectOne(
      `${inventoryUrl}/${buffetId}/products/${productId}/quick-action`,
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({ ok: true });
  });

  it('dado que llamo a updateInventoryStock, deberia actualizar el stock con el endpoint general', () => {
    const buffetId = 'test-buffet-123';
    const productId = 'product-123';
    const payload: InventoryStockUpdateRequest = {
      tipoManejoInventario: 'STOCK_EXACTO',
      stockActual: 15,
      stockMinimo: 5,
      estadoInventario: 'DISPONIBLE',
      disponible: true,
      motivo: 'Volver a stock exacto',
    };

    service.updateInventoryStock(buffetId, productId, payload).subscribe((response) => {
      expect(response).toEqual({ ok: true });
    });

    const req = httpMock.expectOne(
      `${inventoryUrl}/${buffetId}/products/${productId}/stock`,
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({ ok: true });
  });

  it('dado que consulto movimientos, deberia obtener movimientos de stock por producto', () => {
    const buffetId = 'test-buffet-123';
    const productId = 'product-123';

    service.getProductStockMovements(buffetId, productId).subscribe((movements) => {
      expect(movements).toEqual(mockMovements);
    });

    const req = httpMock.expectOne(
      `${inventoryUrl}/${buffetId}/products/${productId}/movements`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockMovements);
  });

  it('dado que consulto por id, deberia obtener un producto', () => {
    const productId = '1';

    service.getById(productId).subscribe((product) => {
      expect(product).toEqual(mockProducts[0]);
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts[0]);
  });

  it('dado que envio un producto nuevo, deberia crearlo', () => {
    const payload: CreateProductRequest = {
      nombre: 'New Product',
      descripcion: 'New Desc',
      precio: 150,
      peso: 1.5,
      requierePreparacion: false,
      categoriaId: 'c1',
      nuevaCategoriaNombre: '',
      buffetId: 'b1',
      stockActual: 5,
      clasificacionesSaludIds: [],
      tiposIds: null,
    };
    const expectedResponse: Product = { ...payload, id: 'new-id' };

    service.create(payload).subscribe((product) => {
      expect(product).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne(productsUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(expectedResponse);
  });

  it('dado que falla la creacion, deberia manejar el error de validacion', () => {
    const payload = {} as CreateProductRequest;

    service.create(payload).subscribe({
      next: () => fail('should have failed with the 400 error'),
      error: (error) => {
        expect(error.status).toEqual(400);
      }
    });

    const req = httpMock.expectOne(productsUrl);
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
  });

  it('dado que llamo a update, deberia enviar un PUT y retornar el producto actualizado', () => {
    const productId = '1';
    const payload: UpdateProductRequest = {
      nombre: 'Updated Name',
      descripcion: 'Updated Desc',
      precio: 120,
      peso: 1,
      requierePreparacion: true,
      stockActual: 15,
      buffetId: 'b1',
      categoriaId: 'c1',
      clasificacionesSaludIds: [],
    };
    const expectedResponse: Product = { ...payload, id: productId };

    service.update(productId, payload).subscribe((product) => {
      expect(product).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(expectedResponse);
  });

  it('dado que llamo a delete, deberia eliminar un producto', () => {
    const productId = '1';

    service.delete(productId).subscribe((response) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
