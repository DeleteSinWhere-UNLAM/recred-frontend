import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ProductoService } from './producto.service';
import { Producto } from '../models/producto.interface';
import { SolicitudCrearProducto } from '../models/requests/crear-producto-request.interface';
import { SolicitudActualizarProducto } from '../models/requests/actualizar-producto-request.interface';
import { Categoria } from '../models/categoria.interface';
import {
  ItemResumenInventario,
  MovimientoStockInventario,
  SolicitudActualizarStockInventario,
  SolicitudAccionRapidaStock,
} from '../models/inventario.interface';

describe('ProductoService', () => {
  let service: ProductoService;
  let httpMock: HttpTestingController;
  const productsUrl = `${environment.apiUrl}/products`;
  const categoriesUrl = `${environment.apiUrl}/categories`;
  const inventoryUrl = `${environment.apiUrl}/inventory`;

  const mockProducts: Producto[] = [
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

  const mockCategories: Categoria[] = [
    { id: 'c1', descripcion: 'Categoria 1', activo: true },
    { id: 'c2', descripcion: 'Categoria 2', activo: true },
  ];

  const mockOverview: ItemResumenInventario[] = [
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

  const mockMovements: MovimientoStockInventario[] = [
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

  it('deberia retornar un arreglo de productos al llamar a getAll', () => {
    service.getAll().subscribe((products) => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne(productsUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('deberia retornar categorias al llamar a getCategories', () => {
    service.getCategories().subscribe((categories) => {
      expect(categories).toEqual(mockCategories);
    });

    const req = httpMock.expectOne(categoriesUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
  });

  it('deberia enviar buffetId como parametro al llamar a getAllByBuffetId', () => {
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

  it('deberia obtener el overview de inventario por buffet', () => {
    const buffetId = 'test-buffet-123';

    service.getInventoryOverview(buffetId).subscribe((overview) => {
      expect(overview).toEqual(mockOverview);
    });

    const req = httpMock.expectOne(`${inventoryUrl}/${buffetId}/overview`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOverview);
  });

  it('deberia enviar quick action de inventario', () => {
    const buffetId = 'test-buffet-123';
    const productId = 'product-123';
    const payload: SolicitudAccionRapidaStock = {
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

  it('deberia actualizar stock con el endpoint general', () => {
    const buffetId = 'test-buffet-123';
    const productId = 'product-123';
    const payload: SolicitudActualizarStockInventario = {
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

  it('deberia obtener movimientos de stock por producto', () => {
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

  it('deberia obtener un producto por id', () => {
    const productId = '1';

    service.getById(productId).subscribe((product) => {
      expect(product).toEqual(mockProducts[0]);
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts[0]);
  });

  it('deberia crear un producto', () => {
    const payload: SolicitudCrearProducto = {
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

  it('debería manejar el error de validación si create falla', () => {
    const payload = {} as SolicitudCrearProducto;

    service.create(payload).subscribe({
      next: () => fail('should have failed with the 400 error'),
      error: (error) => {
        expect(error.status).toEqual(400);
      }
    });

    const req = httpMock.expectOne(productsUrl);
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
  });

  it('debería enviar un PUT y retornar el producto actualizado al llamar a update', () => {
    const productId = '1';
    const payload: SolicitudActualizarProducto = {
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

  it('deberia eliminar un producto', () => {
    const productId = '1';

    service.delete(productId).subscribe((response) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
