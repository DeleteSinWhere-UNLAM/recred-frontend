import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UpdatedInventoryPageComponent } from './updated-inventory-page.component';
import { ProductService } from '../services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
import { of, throwError } from 'rxjs';
import { Product } from '../models/product.interface';
import { Category } from '../models/category.interface';
import { ProductFormData } from '../components/product-form/product-form.component';

describe('UpdatedInventoryPageComponent', () => {
  let component: UpdatedInventoryPageComponent;
  let fixture: ComponentFixture<UpdatedInventoryPageComponent>;
  let productServiceMock: jasmine.SpyObj<ProductService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;

  const mockCategories: Category[] = [
    { id: 'c1', descripcion: 'Category 1', activo: true },
    { id: 'c2', descripcion: 'Category 2', activo: true }
  ];

  const mockProducts: Product[] = [
    {
      id: '1',
      nombre: 'Product 1',
      descripcion: 'Desc 1',
      precio: 100,
      peso: 1,
      requierePreparacion: false,
      stockActual: 10,
      categoria: { id: 'c1', descripcion: 'Category 1' }
    },
    {
      id: '2',
      nombre: 'Product 2',
      descripcion: 'Desc 2',
      precio: 200,
      peso: 2,
      requierePreparacion: true,
      stockActual: 20
    }
  ];

  beforeEach(async () => {
    productServiceMock = jasmine.createSpyObj('ProductService', ['getCategories', 'getAllByBuffetId', 'create', 'update', 'delete']);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['mostrar']);

    productServiceMock.getCategories.and.returnValue(of(mockCategories));
    productServiceMock.getAllByBuffetId.and.returnValue(of(mockProducts));

    await TestBed.configureTestingModule({
      imports: [UpdatedInventoryPageComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UpdatedInventoryPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar las categorías y los productos al iniciar', () => {
    fixture.detectChanges(); // Triggers ngOnInit

    expect(productServiceMock.getCategories).toHaveBeenCalled();
    expect(productServiceMock.getAllByBuffetId).toHaveBeenCalled();
    expect(component.categories).toEqual(mockCategories);
    expect(component.products.length).toBe(2);
    expect(component.products[0].categoriaId).toBe('c1');
    expect(component.products[1].categoriaId).toBeNull();
  });

  it('debería mostrar un toast de error si falla la carga de categorías', () => {
    productServiceMock.getCategories.and.returnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Error al cargar las categorías', 'error');
  });

  it('debería mostrar un toast de error si falla la carga de productos', () => {
    productServiceMock.getAllByBuffetId.and.returnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Error al cargar los productos', 'error');
    expect(component.isLoading).toBeFalse();
  });

  it('debería inicializar selectedProduct a null y mostrar el formulario al llamar openCreateForm', () => {
    component.openCreateForm();

    expect(component.selectedProduct).toBeNull();
    expect(component.isFormVisible).toBeTrue();
  });

  it('debería asignar selectedProduct y mostrar el formulario al llamar openEditForm', () => {
    component.openEditForm(mockProducts[0]);

    expect(component.selectedProduct).toEqual(mockProducts[0]);
    expect(component.isFormVisible).toBeTrue();
  });

  it('debería crear el producto y recargar la lista al enviar un formulario nuevo', () => {
    productServiceMock.create.and.returnValue(of(mockProducts[0]));
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
      contiene_tacc: false
    };

    component.selectedProduct = null;
    component.handleFormSubmit(formData);

    expect(productServiceMock.create).toHaveBeenCalled();
    expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Producto creado exitosamente', 'success');
    expect(component.isFormVisible).toBeFalse();
    expect(component.loadProducts).toHaveBeenCalled();
  });

  it('debería mostrar un toast de error si la creación del producto falla', () => {
    productServiceMock.create.and.returnValue(throwError(() => new Error('API Error')));

    const formData = {} as ProductFormData;
    component.selectedProduct = null;
    component.handleFormSubmit(formData);

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Error al crear el producto', 'error');
    expect(component.isSaving).toBeFalse();
  });

  it('debería actualizar el producto y recargar la lista al enviar un formulario de edición', () => {
    productServiceMock.update.and.returnValue(of(mockProducts[0]));
    spyOn(component, 'loadProducts');

    const formData = { categoriaId: 'NEW', nuevaCategoriaNombre: 'New Cat' } as ProductFormData;

    component.selectedProduct = mockProducts[0];
    component.handleFormSubmit(formData);

    expect(productServiceMock.update).toHaveBeenCalled();
    expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Producto actualizado exitosamente', 'success');
    expect(component.isFormVisible).toBeFalse();
    expect(component.loadProducts).toHaveBeenCalled();
  });

  it('debería mostrar un toast de error si la actualización del producto falla', () => {
    productServiceMock.update.and.returnValue(throwError(() => new Error('API Error')));

    const formData = {} as ProductFormData;
    component.selectedProduct = mockProducts[0];
    component.handleFormSubmit(formData);

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Error al actualizar el producto', 'error');
    expect(component.isSaving).toBeFalse();
  });

  it('debería asignar deleteTarget cuando se solicita eliminar un producto', () => {
    component.requestDelete(mockProducts[0]);
    expect(component.deleteTarget).toEqual(mockProducts[0]);
  });

  it('debería eliminar el producto correctamente y actualizar la lista al confirmar', () => {
    productServiceMock.delete.and.returnValue(of(void 0));
    component.products = [...mockProducts];
    component.deleteTarget = mockProducts[0];

    component.confirmDelete();

    expect(productServiceMock.delete).toHaveBeenCalledWith(mockProducts[0].id);
    expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Producto eliminado correctamente', 'success');
    expect(component.products.length).toBe(1);
    expect(component.deleteTarget).toBeNull();
  });

  it('debería mostrar un toast de error si falla la eliminación del producto', () => {
    productServiceMock.delete.and.returnValue(throwError(() => new Error('API Error')));
    component.deleteTarget = mockProducts[0];

    component.confirmDelete();

    expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Error al eliminar el producto', 'error');
  });

  it('debería limpiar deleteTarget al cancelar la eliminación', () => {
    component.deleteTarget = mockProducts[0];
    component.cancelDelete();

    expect(component.deleteTarget).toBeNull();
  });
});
