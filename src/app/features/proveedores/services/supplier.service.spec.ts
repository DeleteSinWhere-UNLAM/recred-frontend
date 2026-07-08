import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ItemListaPrecioProveedorResponse,
  RecomendacionProveedor,
  SupplierRequest,
  SupplierResponse,
} from '../models/proveedores.interfaces';
import {
  ItemListaPrecioMother,
  ListaPrecioProveedorMother,
  RecomendacionProveedorMother,
  SUPPLIER_ID_TEST,
  SupplierRequestMother,
  SupplierResponseMother,
} from '../proveedores.mother';
import { SupplierService } from './supplier.service';

describe('SupplierService', () => {
  const SUPPLIERS = `${environment.apiUrl}/suppliers`;
  const URL_SUPPLIER_BY_ID = (id: string): string => `${SUPPLIERS}/${id}`;
  const URL_PRICE_LISTS = (id: string): string => `${SUPPLIERS}/${id}/price-lists`;
  const URL_MAPPING = (itemId: string): string => `${SUPPLIERS}/price-list-items/${itemId}/mapping`;
  const URL_RECOMMENDATIONS = `${SUPPLIERS}/purchase-recommendations`;

  let service: SupplierService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SupplierService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SupplierService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('lectura', () => {
    it('dado el service, cuando pido getSuppliers, deberia hacer GET /suppliers y devolver la lista', async () => {
      const suppliers = [SupplierResponseMother.crear(), SupplierResponseMother.crearOtro()];

      const promesa = whenPidoTodosLosSuppliers();

      thenSeHizoGetSuppliers().flush(suppliers);

      expect((await promesa).length).toBe(2);
    });

    it('dado un id, cuando pido getSupplierById, deberia hacer GET /suppliers/{id}', async () => {
      const supplier = SupplierResponseMother.crear();

      const promesa = whenPidoSupplierPorId(SUPPLIER_ID_TEST);

      thenSeHizoGetSupplierPorId(SUPPLIER_ID_TEST).flush(supplier);

      expect((await promesa).id).toBe(SUPPLIER_ID_TEST);
    });
  });

  describe('mutaciones', () => {
    it('dado un request, cuando creo un proveedor, deberia hacer POST /suppliers con el body', async () => {
      const request = SupplierRequestMother.crear();

      const promesa = whenCreoUnSupplier(request);

      thenSeHizoPostSupplierCon(request).flush(SupplierResponseMother.crear({ id: 'nuevo' }));

      expect((await promesa).id).toBe('nuevo');
    });

    it('dado un id y un request, cuando actualizo, deberia hacer PUT /suppliers/{id}', async () => {
      const request = SupplierRequestMother.crear({ nombre: 'Actualizado' });

      const promesa = whenActualizoSupplier(SUPPLIER_ID_TEST, request);

      thenSeHizoPutSupplierPorIdCon(SUPPLIER_ID_TEST, request).flush(SupplierResponseMother.crear({ nombre: 'Actualizado' }));

      expect((await promesa).nombre).toBe('Actualizado');
    });

    it('dado un id, cuando elimino, deberia hacer DELETE /suppliers/{id}', async () => {
      const promesa = whenEliminoSupplier(SUPPLIER_ID_TEST);

      thenSeHizoDeleteSupplierPorId(SUPPLIER_ID_TEST).flush(null);

      await promesa;
    });
  });

  describe('lista de precios', () => {
    it('dado un archivo, cuando subo la lista de precios, deberia hacer POST con FormData que contiene el archivo', async () => {
      const archivo = new File(['contenido'], 'lista.pdf', { type: 'application/pdf' });

      const promesa = firstValueFrom(service.uploadPriceList(SUPPLIER_ID_TEST, archivo));

      thenSeHizoPostPriceListCon(SUPPLIER_ID_TEST, archivo).flush(ListaPrecioProveedorMother.crear());

      await promesa;
    });
  });

  describe('mapeo de items', () => {
    it('dado un itemId y productoInventarioId, cuando actualizo el mapping, deberia hacer PATCH con el body', async () => {
      const promesa = whenActualizoMapping('item-1', 'prod-alfajor');

      thenSeHizoPatchMappingCon('item-1', 'prod-alfajor').flush(ItemListaPrecioMother.crear());

      await promesa;
    });

    it('dado un productoInventarioId null (desmapear), cuando actualizo, deberia mandarlo tal cual en el body', async () => {
      const promesa = whenActualizoMapping('item-1', null);

      thenSeHizoPatchMappingCon('item-1', null).flush(
        ItemListaPrecioMother.crear({ productoInventarioId: null, mappingConfirmado: false }),
      );

      await promesa;
    });
  });

  describe('getPurchaseRecommendations', () => {
    it('dado una lista de productosIds, cuando pido recomendaciones, deberia hacer POST con el array en el body', async () => {
      const productosIds = ['prod-1', 'prod-2'];

      const promesa = whenPidoPurchaseRecommendationsCon(productosIds);

      thenSeHizoPostRecommendationsCon(productosIds).flush([RecomendacionProveedorMother.crear()]);

      const resultado = await promesa;
      expect(resultado.length).toBe(1);
      expect(resultado[0].alternativas.length).toBe(1);
    });
  });

  function whenPidoTodosLosSuppliers(): Promise<SupplierResponse[]> {
    return firstValueFrom(service.getSuppliers());
  }

  function whenPidoSupplierPorId(id: string): Promise<SupplierResponse> {
    return firstValueFrom(service.getSupplierById(id));
  }

  function whenCreoUnSupplier(request: SupplierRequest): Promise<SupplierResponse> {
    return firstValueFrom(service.createSupplier(request));
  }

  function whenActualizoSupplier(id: string, request: SupplierRequest): Promise<SupplierResponse> {
    return firstValueFrom(service.updateSupplier(id, request));
  }

  function whenEliminoSupplier(id: string): Promise<void> {
    return firstValueFrom(service.deleteSupplier(id));
  }

  function whenActualizoMapping(itemId: string, productoInventarioId: string | null): Promise<ItemListaPrecioProveedorResponse> {
    return firstValueFrom(service.updateMapping(itemId, productoInventarioId));
  }

  function whenPidoPurchaseRecommendationsCon(productosIds: string[]): Promise<RecomendacionProveedor[]> {
    return firstValueFrom(service.getPurchaseRecommendations(productosIds));
  }

  function thenSeHizoGetSuppliers(): TestRequest {
    const req = httpMock.expectOne(SUPPLIERS);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoGetSupplierPorId(id: string): TestRequest {
    const req = httpMock.expectOne(URL_SUPPLIER_BY_ID(id));
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoPostSupplierCon(request: SupplierRequest): TestRequest {
    const req = httpMock.expectOne(SUPPLIERS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    return req;
  }

  function thenSeHizoPutSupplierPorIdCon(id: string, request: SupplierRequest): TestRequest {
    const req = httpMock.expectOne(URL_SUPPLIER_BY_ID(id));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    return req;
  }

  function thenSeHizoDeleteSupplierPorId(id: string): TestRequest {
    const req = httpMock.expectOne(URL_SUPPLIER_BY_ID(id));
    expect(req.request.method).toBe('DELETE');
    return req;
  }

  function thenSeHizoPostPriceListCon(supplierId: string, archivo: File): TestRequest {
    const req = httpMock.expectOne(URL_PRICE_LISTS(supplierId));
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('file')).toBe(archivo);
    return req;
  }

  function thenSeHizoPatchMappingCon(itemId: string, productoInventarioId: string | null): TestRequest {
    const req = httpMock.expectOne(URL_MAPPING(itemId));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ productoInventarioId });
    return req;
  }

  function thenSeHizoPostRecommendationsCon(productosIds: string[]): TestRequest {
    const req = httpMock.expectOne(URL_RECOMMENDATIONS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productosIds });
    return req;
  }
});
