import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CargarProductoIaPageComponent } from './cargar-producto-ia-page.component';
import { IaVisionService } from '../services/ia-vision-service/ia-vision-service';
import { ProductoService } from '../../inventario/services/producto.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { SolicitudGuardarProducto } from '../models/guardar-producto-request.interface';
import { of, throwError } from 'rxjs';

describe('CargarProductoIaPageComponent', () => {
  let component: CargarProductoIaPageComponent;
  let fixture: ComponentFixture<CargarProductoIaPageComponent>;
  let aiVisionServiceMock: jasmine.SpyObj<IaVisionService>;
  let productServiceMock: jasmine.SpyObj<ProductoService>;
  let perfilServiceMock: jasmine.SpyObj<PerfilService>;
  let dialogServiceMock: jasmine.SpyObj<DialogService>;
  const mockBuffetId = 'buffet-test-123';

  beforeEach(async () => {
    aiVisionServiceMock = jasmine.createSpyObj('IaVisionService', ['analyzeImage', 'saveProduct']);
    productServiceMock = jasmine.createSpyObj('ProductoService', ['getCategories']);
    perfilServiceMock = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    dialogServiceMock = jasmine.createSpyObj('DialogService', ['alert', 'confirm']);

    productServiceMock.getCategories.and.returnValue(of([]));
    perfilServiceMock.obtenerBuffetId.and.returnValue(mockBuffetId);
    dialogServiceMock.alert.and.returnValue(Promise.resolve(true));

    aiVisionServiceMock.analyzeImage.and.returnValue(of(
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
      imports: [CargarProductoIaPageComponent],
      providers: [
        { provide: IaVisionService, useValue: aiVisionServiceMock },
        { provide: ProductoService, useValue: productServiceMock },
        { provide: PerfilService, useValue: perfilServiceMock },
        { provide: DialogService, useValue: dialogServiceMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CargarProductoIaPageComponent);
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
    expect(aiVisionServiceMock.analyzeImage).toHaveBeenCalledWith(file);
    expect(component.scannedProductData?.nombre).toBe('Galletas de arroz integral');
  });

  it('debería manejar errores al fallar el análisis de la imagen', fakeAsync(() => {
    spyOn(console, 'error');
    aiVisionServiceMock.analyzeImage.and.returnValue(throwError(() => new Error('API Error')));

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    component.handlePhoto(file);
    tick();

    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalled();
    expect(dialogServiceMock.alert).toHaveBeenCalledWith('Hubo un error al procesar la imagen.', 'Error de Análisis');
  }));

  it('deberia guardar el producto usando el buffet del perfil', () => {
    const request: SolicitudGuardarProducto = {
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
    aiVisionServiceMock.saveProduct.and.returnValue(of({}));

    component.saveProduct(request);

    expect(aiVisionServiceMock.saveProduct).toHaveBeenCalledWith({
      ...request,
      buffetId: mockBuffetId,
    });
    expect(component.saveSuccess).toBeTrue();
  });
});
