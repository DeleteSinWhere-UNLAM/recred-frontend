import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CargarProductoIaPage } from './cargar-producto-ia.page';
import { IaVisionService } from './services/ia-vision.service';
import { ProductService } from '../updated-inventory/services/product.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { GuardarProductoRequest } from './models/guardar-producto-request.model';
import { of, throwError } from 'rxjs';

describe('CargarProductoIaPage', () => {
  let component: CargarProductoIaPage;
  let fixture: ComponentFixture<CargarProductoIaPage>;
  let iaVisionServiceMock: jasmine.SpyObj<IaVisionService>;
  let productServiceMock: jasmine.SpyObj<ProductService>;
  let perfilServiceMock: jasmine.SpyObj<PerfilService>;
  const mockBuffetId = 'buffet-test-123';

  beforeEach(async () => {
    iaVisionServiceMock = jasmine.createSpyObj('IaVisionService', ['analyzeImage', 'saveProduct']);
    productServiceMock = jasmine.createSpyObj('ProductService', ['getCategories']);
    perfilServiceMock = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);

    productServiceMock.getCategories.and.returnValue(of([]));
    perfilServiceMock.obtenerBuffetId.and.returnValue(mockBuffetId);

    iaVisionServiceMock.analyzeImage.and.returnValue(of(
      {
        nombre: 'Galletas de arroz integral',
        descripcion: '-',
        peso: '100g',
        contiene_azucar: false,
        contiene_lactosa: false,
        contiene_mani: false,
        contiene_tacc: false
      }));

    await TestBed.configureTestingModule({
      imports: [CargarProductoIaPage],
      providers: [
        { provide: IaVisionService, useValue: iaVisionServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: PerfilService, useValue: perfilServiceMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CargarProductoIaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería activar estado de carga y llamar al servicio al recibir una foto', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    component.handlePhoto(file);

    expect(component.isLoading).toBeFalse();
    expect(iaVisionServiceMock.analyzeImage).toHaveBeenCalledWith(file);
    expect(component.scannedProductData?.nombre).toBe('Galletas de arroz integral');
  });

  it('debería manejar errores al fallar el análisis de la imagen', () => {
    spyOn(console, 'error');
    spyOn(window, 'alert');
    iaVisionServiceMock.analyzeImage.and.returnValue(throwError(() => new Error('API Error')));

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    component.handlePhoto(file);

    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Hubo un error al procesar la imagen.');
  });

  it('deberia guardar el producto usando el buffet del perfil', () => {
    const request: GuardarProductoRequest = {
      nombre: 'Galletas',
      descripcion: 'Galletas de arroz',
      precio: 100,
      peso: 0.1,
      requierePreparacion: false,
      categoriaId: 'cat-1',
      nuevaCategoriaNombre: '',
      buffetId: 'buffet-anterior',
      stockActual: 10,
      clasificacionesSaludIds: [],
      tiposIds: [],
    };
    iaVisionServiceMock.saveProduct.and.returnValue(of({}));

    component.saveProduct(request);

    expect(iaVisionServiceMock.saveProduct).toHaveBeenCalledWith({
      ...request,
      buffetId: mockBuffetId,
    });
    expect(component.saveSuccess).toBeTrue();
  });
});
