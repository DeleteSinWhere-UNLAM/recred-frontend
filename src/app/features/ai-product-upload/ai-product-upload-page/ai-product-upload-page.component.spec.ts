import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AiProductUploadPageComponent } from './ai-product-upload-page.component';
import { AiVisionService } from '../services/ia-vision-service/ai-vision-service';
import { ProductService } from '../../updated-inventory/services/product.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { SaveProductRequest } from '../models/save-product-request.interface';
import { of, throwError } from 'rxjs';

describe('AiProductUploadPageComponent', () => {
  let component: AiProductUploadPageComponent;
  let fixture: ComponentFixture<AiProductUploadPageComponent>;
  let aiVisionServiceMock: jasmine.SpyObj<AiVisionService>;
  let productServiceMock: jasmine.SpyObj<ProductService>;
  let perfilServiceMock: jasmine.SpyObj<PerfilService>;
  const mockBuffetId = 'buffet-test-123';

  beforeEach(async () => {
    aiVisionServiceMock = jasmine.createSpyObj('AiVisionService', ['analyzeImage', 'saveProduct']);
    productServiceMock = jasmine.createSpyObj('ProductService', ['getCategories']);
    perfilServiceMock = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);

    productServiceMock.getCategories.and.returnValue(of([]));
    perfilServiceMock.obtenerBuffetId.and.returnValue(mockBuffetId);

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
      imports: [AiProductUploadPageComponent],
      providers: [
        { provide: AiVisionService, useValue: aiVisionServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: PerfilService, useValue: perfilServiceMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiProductUploadPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería activar estado de carga y llamar al servicio al recibir una foto', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    component.handlePhoto(file);

    expect(component.isLoading).toBeFalse(); // After subscribe it becomes false
    expect(aiVisionServiceMock.analyzeImage).toHaveBeenCalledWith(file);
    expect(component.scannedProductData?.nombre).toBe('Galletas de arroz integral');
  });

  it('debería manejar errores al fallar el análisis de la imagen', () => {
    spyOn(console, 'error');
    spyOn(window, 'alert');
    aiVisionServiceMock.analyzeImage.and.returnValue(throwError(() => new Error('API Error')));

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    component.handlePhoto(file);

    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Hubo un error al procesar la imagen.');
  });

  it('deberia guardar el producto usando el buffet del perfil', () => {
    const request: SaveProductRequest = {
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
