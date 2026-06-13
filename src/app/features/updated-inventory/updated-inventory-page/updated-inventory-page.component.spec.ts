import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UpdatedInventoryPageComponent } from './updated-inventory-page.component';
import { ProductService } from '../services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { of, throwError } from 'rxjs';
import { Product } from '../models/product.interface';
import { Category } from '../models/category.interface';
import { ProductFormData } from '../components/product-form/product-form.component';

// IDs de clasificaciones tal como están en la BD
const ID_SIN_TACC       = '15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8';
const ID_SIN_AZUCAR     = '7e113952-93ca-4797-a80d-54f3a31b2165';
const ID_CONT_LACTEOS   = 'a087290b-474e-4a8c-9e5d-ce1c375d4009';

describe('UpdatedInventoryPageComponent', () => {
  let component: UpdatedInventoryPageComponent;
  let fixture: ComponentFixture<UpdatedInventoryPageComponent>;
  let productServiceMock: jasmine.SpyObj<ProductService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let perfilServiceMock: jasmine.SpyObj<PerfilService>;
  const mockBuffetId = 'buffet-test-123';

  const mockCategories: Category[] = [
    { id: 'c1', descripcion: 'Category 1', activo: true },
    { id: 'c2', descripcion: 'Category 2', activo: true }
  ];

  const mockProducts: Product[] = [
    {
      id: '1', nombre: 'Product 1', descripcion: 'Desc 1',
      precio: 100, peso: 1, requierePreparacion: false, stockActual: 10,
      categoria: { id: 'c1', descripcion: 'Category 1' }
    },
    {
      id: '2', nombre: 'Product 2', descripcion: 'Desc 2',
      precio: 200, peso: 2, requierePreparacion: true, stockActual: 20
    }
  ];

  const formDataBase: ProductFormData = {
    nombre: 'Producto Test',
    descripcion: 'Descripción test',
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

  beforeEach(async () => {
    productServiceMock = jasmine.createSpyObj('ProductService', ['getCategories', 'getAllByBuffetId', 'create', 'update', 'delete']);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['mostrar']);
    perfilServiceMock = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);

    productServiceMock.getCategories.and.returnValue(of(mockCategories));
    productServiceMock.getAllByBuffetId.and.returnValue(of(mockProducts));
    productServiceMock.create.and.returnValue(of(mockProducts[0]));
    productServiceMock.update.and.returnValue(of(mockProducts[0]));
    perfilServiceMock.obtenerBuffetId.and.returnValue(mockBuffetId);

    await TestBed.configureTestingModule({
      imports: [UpdatedInventoryPageComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: PerfilService, useValue: perfilServiceMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdatedInventoryPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar las categorías y los productos al iniciar', () => {
    fixture.detectChanges();
    expect(productServiceMock.getCategories).toHaveBeenCalled();
    expect(productServiceMock.getAllByBuffetId).toHaveBeenCalledWith(mockBuffetId);
    expect(component.categories).toEqual(mockCategories);
    expect(component.products.length).toBe(2);
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

  // ── buildHealthClassificationIds ───────────────────────────────────────────

  describe('buildHealthClassificationIds — mapeo correcto de clasificaciones de salud', () => {
    it('un producto sin TACC, sin azúcar y sin lácteos debe tener Solo Sin TACC y Sin Azúcar', () => {
      const formData: ProductFormData = {
        ...formDataBase,
        contiene_tacc: false,
        contiene_azucar: false,
        contiene_lactosa: false,
      };

      component.selectedProduct = null;
      component.handleFormSubmit(formData);

      const payload = productServiceMock.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).toContain(ID_SIN_TACC);
      expect(payload.clasificacionesSaludIds).toContain(ID_SIN_AZUCAR);
      expect(payload.clasificacionesSaludIds).not.toContain(ID_CONT_LACTEOS);
    });

    it('un producto con TACC no debe tener la clasificación Sin TACC', () => {
      const formData: ProductFormData = {
        ...formDataBase,
        contiene_tacc: true,
        contiene_azucar: false,
        contiene_lactosa: false,
      };

      component.selectedProduct = null;
      component.handleFormSubmit(formData);

      const payload = productServiceMock.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).not.toContain(ID_SIN_TACC);
    });

    it('un producto con azúcar no debe tener la clasificación Sin Azúcar', () => {
      const formData: ProductFormData = {
        ...formDataBase,
        contiene_tacc: false,
        contiene_azucar: true,
        contiene_lactosa: false,
      };

      component.selectedProduct = null;
      component.handleFormSubmit(formData);

      const payload = productServiceMock.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).not.toContain(ID_SIN_AZUCAR);
    });

    it('un producto con lácteos debe tener la clasificación Contiene Lácteos', () => {
      const formData: ProductFormData = {
        ...formDataBase,
        contiene_tacc: false,
        contiene_azucar: false,
        contiene_lactosa: true,
      };

      component.selectedProduct = null;
      component.handleFormSubmit(formData);

      const payload = productServiceMock.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).toContain(ID_CONT_LACTEOS);
    });

    it('un producto con TACC, azúcar y sin lácteos debe tener array vacío de clasificaciones relevantes', () => {
      const formData: ProductFormData = {
        ...formDataBase,
        contiene_tacc: true,
        contiene_azucar: true,
        contiene_lactosa: false,
      };

      component.selectedProduct = null;
      component.handleFormSubmit(formData);

      const payload = productServiceMock.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).not.toContain(ID_SIN_TACC);
      expect(payload.clasificacionesSaludIds).not.toContain(ID_SIN_AZUCAR);
      expect(payload.clasificacionesSaludIds).not.toContain(ID_CONT_LACTEOS);
    });

    it('las mismas clasificaciones deben enviarse al crear y al actualizar un producto', () => {
      const formData: ProductFormData = {
        ...formDataBase,
        contiene_tacc: false,
        contiene_azucar: false,
        contiene_lactosa: true,
      };

      // Crear
      component.selectedProduct = null;
      component.handleFormSubmit(formData);
      const payloadCreate = productServiceMock.create.calls.mostRecent().args[0];

      // Actualizar
      component.selectedProduct = mockProducts[0];
      component.handleFormSubmit(formData);
      const payloadUpdate = productServiceMock.update.calls.mostRecent().args[1];

      expect(payloadCreate.clasificacionesSaludIds).toEqual(payloadUpdate.clasificacionesSaludIds);
    });
  });

  // ── Gestión del formulario ─────────────────────────────────────────────────

  describe('Gestión del formulario', () => {
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
      spyOn(component, 'loadProducts');
      component.selectedProduct = null;
      component.handleFormSubmit(formDataBase);

      expect(productServiceMock.create).toHaveBeenCalled();
      expect(productServiceMock.create.calls.mostRecent().args[0].buffetId).toBe(mockBuffetId);
      expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Producto creado exitosamente', 'success');
      expect(component.isFormVisible).toBeFalse();
      expect(component.loadProducts).toHaveBeenCalled();
    });

    it('debería mostrar error si la creación falla', () => {
      productServiceMock.create.and.returnValue(throwError(() => new Error()));
      component.selectedProduct = null;
      component.handleFormSubmit(formDataBase);
      expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Error al crear el producto', 'error');
    });

    it('debería actualizar el producto al enviar un formulario de edición', () => {
      spyOn(component, 'loadProducts');
      component.selectedProduct = mockProducts[0];
      component.handleFormSubmit(formDataBase);

      expect(productServiceMock.update).toHaveBeenCalled();
      expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Producto actualizado exitosamente', 'success');
    });

    it('debería mostrar error si la actualización falla', () => {
      productServiceMock.update.and.returnValue(throwError(() => new Error()));
      component.selectedProduct = mockProducts[0];
      component.handleFormSubmit(formDataBase);
      expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Error al actualizar el producto', 'error');
    });

    it('debería eliminar el producto y actualizar la lista al confirmar', () => {
      productServiceMock.delete.and.returnValue(of(void 0));
      component.products = [...mockProducts];
      component.deleteTarget = mockProducts[0];

      component.confirmDelete();

      expect(productServiceMock.delete).toHaveBeenCalledWith(mockProducts[0].id);
      expect(toastServiceMock.mostrar).toHaveBeenCalledWith('Producto eliminado correctamente', 'success');
      expect(component.products.length).toBe(1);
    });
  });
});
