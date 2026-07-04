import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
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

      const promesa = firstValueFrom(service.getSuppliers());
      const req = httpMock.expectOne(SUPPLIERS);
      expect(req.request.method).toBe('GET');
      req.flush(suppliers);

      expect((await promesa).length).toBe(2);
    });

    it('dado un id, cuando pido getSupplierById, deberia hacer GET /suppliers/{id}', async () => {
      const supplier = SupplierResponseMother.crear();

      const promesa = firstValueFrom(service.getSupplierById(SUPPLIER_ID_TEST));
      const req = httpMock.expectOne(`${SUPPLIERS}/${SUPPLIER_ID_TEST}`);
      expect(req.request.method).toBe('GET');
      req.flush(supplier);

      expect((await promesa).id).toBe(SUPPLIER_ID_TEST);
    });
  });

  describe('mutaciones', () => {
    it('dado un request, cuando creo un proveedor, deberia hacer POST /suppliers con el body', async () => {
      const request = SupplierRequestMother.crear();

      const promesa = firstValueFrom(service.createSupplier(request));
      const req = httpMock.expectOne(SUPPLIERS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(SupplierResponseMother.crear({ id: 'nuevo' }));

      expect((await promesa).id).toBe('nuevo');
    });

    it('dado un id y un request, cuando actualizo, deberia hacer PUT /suppliers/{id}', async () => {
      const request = SupplierRequestMother.crear({ nombre: 'Actualizado' });

      const promesa = firstValueFrom(service.updateSupplier(SUPPLIER_ID_TEST, request));
      const req = httpMock.expectOne(`${SUPPLIERS}/${SUPPLIER_ID_TEST}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(SupplierResponseMother.crear({ nombre: 'Actualizado' }));

      expect((await promesa).nombre).toBe('Actualizado');
    });

    it('dado un id, cuando elimino, deberia hacer DELETE /suppliers/{id}', async () => {
      const promesa = firstValueFrom(service.deleteSupplier(SUPPLIER_ID_TEST));
      const req = httpMock.expectOne(`${SUPPLIERS}/${SUPPLIER_ID_TEST}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await promesa;
    });
  });

  describe('lista de precios', () => {
    it('dado un archivo, cuando subo la lista de precios, deberia hacer POST con FormData que contiene el archivo', async () => {
      const archivo = new File(['contenido'], 'lista.pdf', { type: 'application/pdf' });

      const promesa = firstValueFrom(service.uploadPriceList(SUPPLIER_ID_TEST, archivo));
      const req = httpMock.expectOne(`${SUPPLIERS}/${SUPPLIER_ID_TEST}/price-lists`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).get('file')).toBe(archivo);
      req.flush(ListaPrecioProveedorMother.crear());

      await promesa;
    });
  });

  describe('mapeo de items', () => {
    it('dado un itemId y productoInventarioId, cuando actualizo el mapping, deberia hacer PATCH con el body', async () => {
      const promesa = firstValueFrom(service.updateMapping('item-1', 'prod-alfajor'));
      const req = httpMock.expectOne(`${SUPPLIERS}/price-list-items/item-1/mapping`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ productoInventarioId: 'prod-alfajor' });
      req.flush(ItemListaPrecioMother.crear());

      await promesa;
    });

    it('dado un productoInventarioId null (desmapear), cuando actualizo, deberia mandarlo tal cual en el body', async () => {
      const promesa = firstValueFrom(service.updateMapping('item-1', null));
      const req = httpMock.expectOne(`${SUPPLIERS}/price-list-items/item-1/mapping`);
      expect(req.request.body).toEqual({ productoInventarioId: null });
      req.flush(ItemListaPrecioMother.crear({ productoInventarioId: null, mappingConfirmado: false }));

      await promesa;
    });
  });

  describe('getPurchaseRecommendations', () => {
    it('dado una lista de productosIds, cuando pido recomendaciones, deberia hacer POST con el array en el body', async () => {
      const productosIds = ['prod-1', 'prod-2'];

      const promesa = firstValueFrom(service.getPurchaseRecommendations(productosIds));
      const req = httpMock.expectOne(`${SUPPLIERS}/purchase-recommendations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ productosIds });
      req.flush([RecomendacionProveedorMother.crear()]);

      const resultado = await promesa;
      expect(resultado.length).toBe(1);
      expect(resultado[0].alternativas.length).toBe(1);
    });
  });
});
