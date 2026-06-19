import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ProductoService } from './producto.service';
import { Producto } from '../models/producto.model';
import { CrearProductoRequest } from '../models/requests/crear-producto-request.model';
import { ActualizarProductoRequest } from '../models/requests/actualizar-producto-request.model';
import { Categoria } from '../models/categoria.model';
import {
  ItemInventario,
  MovimientoStock,
  ActualizacionStockRequest,
  AccionStockRapidaRequest,
} from '../models/inventario.model';

describe('ProductoService', () => {
  let service: ProductoService;
  let httpMock: HttpTestingController;
  const productsUrl = `${environment.apiUrl}/products`;
  const categoriesUrl = `${environment.apiUrl}/categories`;
  const inventoryUrl = `${environment.apiUrl}/inventory`;

  const mockProductos: Producto[] = [
    {
      id: '1',
      nombre: 'Producto 1',
      descripcion: 'Desc 1',
      precio: 100,
      peso: 1,
      requierePreparacion: false,
      stockActual: 10,
      categoriaId: 'c1',
    },
    {
      id: '2',
      nombre: 'Producto 2',
      descripcion: 'Desc 2',
      precio: 200,
      peso: 2,
      requierePreparacion: true,
      stockActual: 20,
      categoriaId: 'c2',
    },
  ];

  const mockCategorias: Categoria[] = [
    { id: 'c1', descripcion: 'Categoria 1', activo: true },
    { id: 'c2', descripcion: 'Categoria 2', activo: true },
  ];

  const mockOverview: ItemInventario[] = [
    {
      productId: '1',
      nombre: 'Producto 1',
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

  const mockMovements: MovimientoStock[] = [
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
      providers: [ProductoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que llamo a getAll, deberia retornar un arreglo de productos', () => {
    service.getAll().subscribe((products) => {
      expect(products).toEqual(mockProductos);
    });

    const req = httpMock.expectOne(productsUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockProductos);
  });

  it('dado que llamo a getCategories, deberia retornar categorias', () => {
    service.getCategories().subscribe((categories) => {
      expect(categories).toEqual(mockCategorias);
    });

    const req = httpMock.expectOne(categoriesUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategorias);
  });

  it('dado que llamo a getAllByBuffetId, deberia enviar buffetId como parametro', () => {
    const buffetId = 'test-buffet-123';

    service.getAllByBuffetId(buffetId).subscribe((products) => {
      expect(products).toEqual(mockProductos);
    });

    const req = httpMock.expectOne(
      (request) => request.url === productsUrl && request.params.get('buffetId') === buffetId,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockProductos);
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
    const payload: AccionStockRapidaRequest = {
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
    const payload: ActualizacionStockRequest = {
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
      expect(product).toEqual(mockProductos[0]);
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProductos[0]);
  });

  it('dado que envio un producto nuevo, deberia crearlo', () => {
    const payload: CrearProductoRequest = {
      nombre: 'New Producto',
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
    const expectedResponse: Producto = { ...payload, id: 'new-id' };

    service.create(payload).subscribe((product) => {
      expect(product).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne(productsUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(expectedResponse);
  });

  it('dado que falla la creacion, deberia manejar el error de validacion', () => {
    const payload = {} as CrearProductoRequest;

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
    const payload: ActualizarProductoRequest = {
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
    const expectedResponse: Producto = { ...payload, id: productId };

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
