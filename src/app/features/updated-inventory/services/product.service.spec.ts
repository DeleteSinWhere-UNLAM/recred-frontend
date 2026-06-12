import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ProductService } from './product.service';
import { Product } from '../models/product.interface';
import { CreateProductRequest } from '../models/requests/create-product-request.interface';
import { UpdateProductRequest } from '../models/requests/update-product-request.interface';
import { Category } from '../models/category.interface';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const productsUrl = `${environment.apiUrl}/products`;
  const categoriesUrl = `${environment.apiUrl}/categories`;

  const mockProducts: Product[] = [
    { id: '1', nombre: 'Product 1', descripcion: 'Desc 1', precio: 100, peso: 1, requierePreparacion: false, stockActual: 10, categoriaId: 'c1' },
    { id: '2', nombre: 'Product 2', descripcion: 'Desc 2', precio: 200, peso: 2, requierePreparacion: true, stockActual: 20, categoriaId: 'c2' }
  ];

  const mockCategories: Category[] = [
    { id: 'c1', descripcion: 'Category 1', activo: true },
    { id: 'c2', descripcion: 'Category 2', activo: true }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería retornar un arreglo de productos al llamar a getAll', () => {
    service.getAll().subscribe(products => {
      expect(products.length).toBe(2);
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne(productsUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('debería retornar un arreglo de categorías al llamar a getCategories', () => {
    service.getCategories().subscribe(categories => {
      expect(categories.length).toBe(2);
      expect(categories).toEqual(mockCategories);
    });

    const req = httpMock.expectOne(categoriesUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
  });

  it('debería manejar el error si getCategories falla', () => {
    service.getCategories().subscribe({
      next: () => fail('should have failed with the 500 error'),
      error: (error) => {
        expect(error.status).toEqual(500);
      }
    });

    const req = httpMock.expectOne(categoriesUrl);
    req.flush('Error fetching categories', { status: 500, statusText: 'Server Error' });
  });

  it('debería enviar el parámetro buffetId y retornar los productos al llamar a getAllByBuffetId', () => {
    const buffetId = 'test-buffet-123';

    service.getAllByBuffetId(buffetId).subscribe(products => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne(req => req.url === productsUrl && req.params.get('buffetId') === buffetId);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('debería obtener un solo producto por su id al llamar a getById', () => {
    const productId = '1';

    service.getById(productId).subscribe(product => {
      expect(product).toEqual(mockProducts[0]);
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts[0]);
  });

  it('debería enviar un POST y retornar el producto creado al llamar a create', () => {
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
      tiposIds: null
    };

    const expectedResponse: Product = { ...payload, id: 'new-id' };

    service.create(payload).subscribe(product => {
      expect(product).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne(productsUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(expectedResponse);
  });

  it('debería manejar el error de validación si create falla', () => {
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

  it('debería enviar un PUT y retornar el producto actualizado al llamar a update', () => {
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
      clasificacionesSaludIds: []
    };

    const expectedResponse: Product = { ...payload, id: productId };

    service.update(productId, payload).subscribe(product => {
      expect(product).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(expectedResponse);
  });

  it('debería enviar un DELETE del producto al llamar a delete', () => {
    const productId = '1';

    service.delete(productId).subscribe(res => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${productsUrl}/${productId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
