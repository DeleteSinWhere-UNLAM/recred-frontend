import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BUFFET_ID_TEST,
  CategoriaInventarioMother,
  ItemResumenInventarioMother,
  MovimientoStockInventarioMother,
  PRODUCTO_ID_TEST,
  ProductoInventarioMother,
  SolicitudAccionRapidaStockMother,
  SolicitudActualizarProductoMother,
  SolicitudActualizarStockInventarioMother,
  SolicitudCrearProductoMother,
} from '../inventario.mother';
import { ProductoService } from './producto.service';

describe('ProductoService', () => {
  const PRODUCTS = `${environment.apiUrl}/products`;
  const CATEGORIES = `${environment.apiUrl}/categories`;
  const INVENTORY = `${environment.apiUrl}/inventory`;

  let service: ProductoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('lectura de productos', () => {
    it('dado el service, cuando pido getAll, deberia hacer GET /products y devolver el listado', async () => {
      const productos = [ProductoInventarioMother.crear(), ProductoInventarioMother.crearRequierePreparacion()];

      const promesa = firstValueFrom(service.getAll());
      const req = thenSeHaceUnGetA(PRODUCTS);
      req.flush(productos);

      expect((await promesa).length).toBe(2);
    });

    it('dado un buffetId, cuando pido getAllByBuffetId, deberia agregar buffetId como query param', async () => {
      const promesa = firstValueFrom(service.getAllByBuffetId(BUFFET_ID_TEST));

      const req = httpMock.expectOne(
        (r) => r.url === PRODUCTS && r.params.get('buffetId') === BUFFET_ID_TEST,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('buffetId')).toBe(BUFFET_ID_TEST);
      req.flush([ProductoInventarioMother.crear()]);
      await promesa;
    });

    it('dado un id, cuando pido getById, deberia devolver el producto', async () => {
      const producto = ProductoInventarioMother.crear();

      const promesa = firstValueFrom(service.getById(PRODUCTO_ID_TEST));
      thenSeHaceUnGetA(`${PRODUCTS}/${PRODUCTO_ID_TEST}`).flush(producto);

      expect(await promesa).toEqual(producto);
    });

    it('dado un id y buffetId, cuando pido getById, deberia agregar buffetId como query param', async () => {
      const producto = ProductoInventarioMother.crear();

      const promesa = firstValueFrom(service.getById(PRODUCTO_ID_TEST, BUFFET_ID_TEST));
      const req = httpMock.expectOne(
        (r) => r.url === `${PRODUCTS}/${PRODUCTO_ID_TEST}` && r.params.get('buffetId') === BUFFET_ID_TEST,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('buffetId')).toBe(BUFFET_ID_TEST);
      req.flush(producto);

      expect(await promesa).toEqual(producto);
    });
  });

  describe('getCategories', () => {
    it('dado el service, cuando pido getCategories, deberia hacer GET /categories y devolver el listado', async () => {
      const categorias = [
        CategoriaInventarioMother.crear(),
        CategoriaInventarioMother.crearInactiva(),
      ];

      const promesa = firstValueFrom(service.getCategories());
      thenSeHaceUnGetA(CATEGORIES).flush(categorias);

      expect((await promesa).length).toBe(2);
    });
  });

  describe('inventario del buffet', () => {
    it('dado un buffet, cuando pido getInventoryOverview, deberia hacer GET al overview', async () => {
      const promesa = firstValueFrom(service.getInventoryOverview(BUFFET_ID_TEST));
      const req = thenSeHaceUnGetA(`${INVENTORY}/${BUFFET_ID_TEST}/overview`);
      req.flush([ItemResumenInventarioMother.crear()]);

      expect((await promesa).length).toBe(1);
    });

    it('dado un buffet y producto, cuando pido getProductStockMovements, deberia devolver los movimientos', async () => {
      const promesa = firstValueFrom(
        service.getProductStockMovements(BUFFET_ID_TEST, PRODUCTO_ID_TEST),
      );
      thenSeHaceUnGetA(
        `${INVENTORY}/${BUFFET_ID_TEST}/products/${PRODUCTO_ID_TEST}/movements`,
      ).flush([MovimientoStockInventarioMother.crear()]);

      expect((await promesa).length).toBe(1);
    });
  });

  describe('quickStockAction', () => {
    it('dado ADD_STOCK, cuando disparo la accion rapida, deberia hacer PATCH con el payload', async () => {
      const payload = SolicitudAccionRapidaStockMother.crearAddStock();

      const promesa = firstValueFrom(
        service.quickStockAction(BUFFET_ID_TEST, PRODUCTO_ID_TEST, payload),
      );
      const req = thenSeHaceUnPatchA(
        `${INVENTORY}/${BUFFET_ID_TEST}/products/${PRODUCTO_ID_TEST}/quick-action`,
      );
      expect(req.request.body).toEqual(payload);
      req.flush({ ok: true });
      await promesa;
    });

    it('dado MARK_SOLD_OUT, cuando disparo la accion rapida, deberia mandar solo action y motivo', async () => {
      const payload = SolicitudAccionRapidaStockMother.crearMarcarAgotado();

      const promesa = firstValueFrom(
        service.quickStockAction(BUFFET_ID_TEST, PRODUCTO_ID_TEST, payload),
      );
      const req = thenSeHaceUnPatchA(
        `${INVENTORY}/${BUFFET_ID_TEST}/products/${PRODUCTO_ID_TEST}/quick-action`,
      );
      expect(req.request.body).toEqual(payload);
      req.flush({});
      await promesa;
    });
  });

  describe('updateInventoryStock', () => {
    it('dado un payload de stock, cuando actualizo, deberia hacer PATCH al endpoint general', async () => {
      const payload = SolicitudActualizarStockInventarioMother.crear();

      const promesa = firstValueFrom(
        service.updateInventoryStock(BUFFET_ID_TEST, PRODUCTO_ID_TEST, payload),
      );
      const req = thenSeHaceUnPatchA(
        `${INVENTORY}/${BUFFET_ID_TEST}/products/${PRODUCTO_ID_TEST}/stock`,
      );
      expect(req.request.body).toEqual(payload);
      req.flush({ ok: true });
      await promesa;
    });
  });

  describe('mutaciones de producto', () => {
    it('dado un payload valido, cuando creo un producto, deberia hacer POST /products', async () => {
      const payload = SolicitudCrearProductoMother.crear({ nombre: 'Alfajor' });

      const promesa = firstValueFrom(service.create(payload));
      const req = thenSeHaceUnPostA(PRODUCTS);
      expect(req.request.body).toEqual(payload);
      req.flush({ ...payload, id: 'nuevo' });

      expect((await promesa).id).toBe('nuevo');
    });

    it('dado un lote de productos, cuando creo bulk, deberia hacer POST /products/bulk', async () => {
      const payloads = [SolicitudCrearProductoMother.crear()];

      const promesa = firstValueFrom(service.createBulk(payloads));
      const req = thenSeHaceUnPostA(`${PRODUCTS}/bulk`);
      expect(req.request.body).toEqual(payloads);
      req.flush(payloads);
      await promesa;
    });

    it('dado que el back responde 400, cuando creo un producto, deberia rechazar con el error', async () => {
      const promesa = firstValueFrom(service.create(SolicitudCrearProductoMother.crear()));
      httpMock.expectOne(PRODUCTS).flush('Bad Request', {
        status: 400,
        statusText: 'Bad Request',
      });

      await expectAsync(promesa).toBeRejectedWith(
        jasmine.objectContaining({ status: 400 }),
      );
    });

    it('dado un id y payload, cuando actualizo, deberia hacer PUT y devolver el producto actualizado', async () => {
      const payload = SolicitudActualizarProductoMother.crear();

      const promesa = firstValueFrom(service.update(PRODUCTO_ID_TEST, payload));
      const req = httpMock.expectOne(`${PRODUCTS}/${PRODUCTO_ID_TEST}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...payload, id: PRODUCTO_ID_TEST });

      expect((await promesa).id).toBe(PRODUCTO_ID_TEST);
    });

    it('dado un id, cuando lo elimino, deberia hacer DELETE /products/{id}', async () => {
      const promesa = firstValueFrom(service.delete(PRODUCTO_ID_TEST));
      const req = httpMock.expectOne(`${PRODUCTS}/${PRODUCTO_ID_TEST}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promesa;
    });
  });

  function thenSeHaceUnGetA(url: string) {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHaceUnPostA(url: string) {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    return req;
  }

  function thenSeHaceUnPatchA(url: string) {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('PATCH');
    return req;
  }
});
