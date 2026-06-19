import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductFormComponent } from './product-form.component';
import { environment } from '../../../../../environments/environment';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('debería crear', () => {
    expect(component).toBeTruthy();
  });

  it('isEditing debería retornar true si hay producto', () => {
    expect(component.isEditing).toBeFalse();
    component.product = { id: '1' } as any;
    expect(component.isEditing).toBeTrue();
  });

  it('ngOnChanges debería inicializar el formulario con producto', () => {
    const product = { 
      nombre: 'Test', descripcion: 'Desc', precio: 10, peso: 1, stockActual: 5,
      categoriaId: 'cat1', requierePreparacion: false,
      clasificacionesSalud: []
    } as any;
    
    component.product = product;
    component.ngOnChanges({
      product: {
        currentValue: product,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });

    expect(component.productForm.get('nombre')?.value).toBe('Test');
    expect(component.productForm.get('categoriaId')?.value).toBe('cat1');
  });

  it('ngOnChanges debería resetear si el producto es nulo', () => {
    component.ngOnChanges({
      product: {
        currentValue: null,
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.productForm.get('requierePreparacion')?.value).toBeFalse();
  });

  it('debería actualizar validadores si categoriaId es NEW', () => {
    component.ngOnInit();
    const ctrl = component.productForm.get('categoriaId');
    ctrl?.setValue('NEW');
    
    expect(component.productForm.get('nuevaCategoriaNombre')?.hasError('required')).toBeTrue();
    
    ctrl?.setValue('cat1');
    expect(component.productForm.get('nuevaCategoriaNombre')?.hasError('required')).toBeFalse();
  });

  it('submitForm debería emitir formSubmit si es válido', () => {
    spyOn(component.formSubmit, 'emit');
    
    component.productForm.patchValue({
      nombre: 'Prod Test',
      descripcion: 'Desc test',
      precio: 100,
      peso: 10,
      stockActual: 5,
      categoriaId: 'cat1'
    });

    component.submitForm();
    expect(component.formSubmit.emit).toHaveBeenCalled();
  });

  it('submitForm no debería emitir si es inválido', () => {
    spyOn(component.formSubmit, 'emit');
    component.productForm.patchValue({ nombre: '' });
    component.submitForm();
    expect(component.formSubmit.emit).not.toHaveBeenCalled();
  });

  it('getErrorMessage debería retornar mensajes correctos', () => {
    const ctrl = component.productForm.get('nombre');
    ctrl?.setValue('');
    ctrl?.markAsTouched();
    expect(component.getErrorMessage('nombre')).toBe('Este campo es obligatorio');
    
    ctrl?.setValue('a');
    expect(component.getErrorMessage('nombre')).toContain('Mínimo');
    
    const precioCtrl = component.productForm.get('precio');
    precioCtrl?.setValue(-1);
    precioCtrl?.markAsTouched();
    expect(component.getErrorMessage('precio')).toContain('El valor mínimo');
  });

  it('onFileSelected debería subir imagen', () => {
    const file = new File([''], 'img.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as unknown as Event;
    
    // Simular FileReader
    spyOn(window as any, 'FileReader').and.returnValue({
      readAsDataURL: function() { this.onload(); },
      result: 'data:image/jpeg;base64,'
    });

    component.onFileSelected(event);
    
    const req = httpTestingController.expectOne(`${environment.apiUrl}/load-stock/upload-image`);
    expect(req.request.method).toBe('POST');
    req.flush({ url_imagen: 'http://cloud.com/img.jpg' });

    expect(component.productForm.get('urlImagen')?.value).toBe('http://cloud.com/img.jpg');
    expect(component.imagePreview()).toBe('http://cloud.com/img.jpg');
  });
  
  it('onFileSelected maneja error', () => {
      const file = new File([''], 'img.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as unknown as Event;
      
      spyOn(window as any, 'FileReader').and.returnValue({
        readAsDataURL: function() { this.onload(); },
        result: 'data:image/jpeg;base64,'
      });
  
      component.onFileSelected(event);
      
      const req = httpTestingController.expectOne(`${environment.apiUrl}/load-stock/upload-image`);
      req.error(new ProgressEvent('error'));
  
      expect(component.isUploadingImage()).toBeFalse();
  });
});
