import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { environment } from '../../../../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpTestingController: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/products`;
  const inventoryUrl = `${environment.apiUrl}/inventory`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ProductService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('debería ser creado', () => {
    expect(service).toBeTruthy();
  });

  it('getAll debería hacer un GET', () => {
    service.getAll().subscribe();
    const req = httpTestingController.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getCategories debería hacer un GET a categories', () => {
    service.getCategories().subscribe();
    const req = httpTestingController.expectOne(`${environment.apiUrl}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getAllByBuffetId debería hacer un GET con params', () => {
    service.getAllByBuffetId('buffet123').subscribe();
    const req = httpTestingController.expectOne(`${baseUrl}?buffetId=buffet123`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getInventoryOverview debería hacer un GET', () => {
    service.getInventoryOverview('buffet123').subscribe();
    const req = httpTestingController.expectOne(`${inventoryUrl}/buffet123/overview`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('quickStockAction debería hacer un PATCH', () => {
    service.quickStockAction('buffet1', 'prod1', { tipo: 'VENTA', cantidad: 1 } as any).subscribe();
    const req = httpTestingController.expectOne(`${inventoryUrl}/buffet1/products/prod1/quick-action`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ tipo: 'VENTA', cantidad: 1 });
    req.flush({});
  });

  it('updateInventoryStock debería hacer un PATCH', () => {
    service.updateInventoryStock('buffet1', 'prod1', { stockActual: 10 } as any).subscribe();
    const req = httpTestingController.expectOne(`${inventoryUrl}/buffet1/products/prod1/stock`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('getProductStockMovements debería hacer un GET', () => {
    service.getProductStockMovements('buffet1', 'prod1').subscribe();
    const req = httpTestingController.expectOne(`${inventoryUrl}/buffet1/products/prod1/movements`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById debería hacer un GET', () => {
    service.getById('1').subscribe();
    const req = httpTestingController.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create debería hacer un POST', () => {
    const payload: any = { nombre: 'Test' };
    service.create(payload).subscribe();
    const req = httpTestingController.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('createBulk debería hacer un POST', () => {
    const payload: any[] = [{ nombre: 'Test' }];
    service.createBulk(payload).subscribe();
    const req = httpTestingController.expectOne(`${baseUrl}/bulk`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush([]);
  });

  it('update debería hacer un PUT', () => {
    const payload: any = { nombre: 'Test' };
    service.update('1', payload).subscribe();
    const req = httpTestingController.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('delete debería hacer un DELETE', () => {
    service.delete('1').subscribe();
    const req = httpTestingController.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
