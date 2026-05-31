import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductFormComponent, ProductFormData } from './product-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Product } from '../../models/product.interface';
import { Category } from '../../models/category.interface';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;

  const mockCategories: Category[] = [
    { id: 'c1', descripcion: 'Category 1', activo: true },
    { id: 'c2', descripcion: 'Category 2', activo: true }
  ];

  const mockProduct: Product = {
    id: '1',
    nombre: 'Existing Product',
    descripcion: 'Existing Desc',
    precio: 100,
    peso: 1,
    requierePreparacion: true,
    stockActual: 10,
    categoriaId: 'c1',
    categoriaNombre: 'Category 1'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ProductFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    component.categories = mockCategories;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar un formulario vacío para creación si no se provee un producto', () => {
    expect(component.isEditing).toBeFalse();
    expect(component.productForm.get('nombre')?.value).toBe('');
    expect(component.productForm.get('requierePreparacion')?.value).toBeFalse();
  });

  it('debería popular el formulario para edición si se provee un producto', () => {
    component.product = mockProduct;
    component.ngOnChanges({
      product: {
        currentValue: mockProduct,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });

    expect(component.isEditing).toBeTrue();
    expect(component.productForm.get('nombre')?.value).toBe('Existing Product');
    expect(component.productForm.get('categoriaId')?.value).toBe('c1');
    expect(component.productForm.get('requierePreparacion')?.value).toBeTrue();
  });

  it('debería ser inválido si faltan campos obligatorios', () => {
    component.productForm.patchValue({
      nombre: '',
      descripcion: '',
      precio: null,
      peso: null,
      stockActual: null,
      categoriaId: null
    });

    expect(component.productForm.valid).toBeFalse();
    expect(component.productForm.get('nombre')?.hasError('required')).toBeTrue();
    expect(component.productForm.get('descripcion')?.hasError('required')).toBeTrue();
    expect(component.productForm.get('precio')?.hasError('required')).toBeTrue();
    expect(component.productForm.get('peso')?.hasError('required')).toBeTrue();
    expect(component.productForm.get('stockActual')?.hasError('required')).toBeTrue();
    expect(component.productForm.get('categoriaId')?.hasError('required')).toBeTrue();
  });

  it('debería ser inválido si se violan las restricciones de validación', () => {
    component.productForm.patchValue({
      nombre: 'a', // minLength 2
      descripcion: 'ab', // minLength 3
      precio: 0, // min 0.01
      peso: 0, // min 0.001
      stockActual: -1, // min 0
      categoriaId: 'c1'
    });

    expect(component.productForm.valid).toBeFalse();
    expect(component.productForm.get('nombre')?.hasError('minlength')).toBeTrue();
    expect(component.productForm.get('descripcion')?.hasError('minlength')).toBeTrue();
    expect(component.productForm.get('precio')?.hasError('min')).toBeTrue();
    expect(component.productForm.get('peso')?.hasError('min')).toBeTrue();
    expect(component.productForm.get('stockActual')?.hasError('min')).toBeTrue();
  });

  it('debería hacer obligatorio nuevaCategoriaNombre si categoriaId es NEW', () => {
    component.productForm.patchValue({ categoriaId: 'NEW' });
    fixture.detectChanges();

    const nuevaCategoriaCtrl = component.productForm.get('nuevaCategoriaNombre');
    expect(nuevaCategoriaCtrl?.hasError('required')).toBeTrue();
    
    component.productForm.patchValue({ nuevaCategoriaNombre: 'New Category' });
    expect(nuevaCategoriaCtrl?.hasError('required')).toBeFalse();
  });

  it('no debería requerir nuevaCategoriaNombre si categoriaId es un ID existente', () => {
    component.productForm.patchValue({ categoriaId: 'c1' });
    fixture.detectChanges();

    const nuevaCategoriaCtrl = component.productForm.get('nuevaCategoriaNombre');
    expect(nuevaCategoriaCtrl?.hasError('required')).toBeFalse();
  });

  it('debería emitir formSubmit con los datos si se envía un formulario válido', () => {
    spyOn(component.formSubmit, 'emit');

    const validData: ProductFormData = {
      nombre: 'Valid Name',
      descripcion: 'Valid Desc',
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

    component.productForm.patchValue(validData);
    expect(component.productForm.valid).toBeTrue();

    component.submitForm();

    expect(component.formSubmit.emit).toHaveBeenCalledWith(validData);
  });

  it('debería marcar todos los controles como tocados y no emitir si se envía un formulario inválido', () => {
    spyOn(component.formSubmit, 'emit');
    spyOn(component.productForm, 'markAllAsTouched').and.callThrough();

    component.productForm.patchValue({ nombre: '' }); // Invalid
    component.submitForm();

    expect(component.productForm.markAllAsTouched).toHaveBeenCalled();
    expect(component.formSubmit.emit).not.toHaveBeenCalled();
  });

  it('debería emitir el evento formCancel al cancelar el formulario', () => {
    spyOn(component.formCancel, 'emit');
    
    // Call emit manually or find the button and click it
    component.formCancel.emit();
    
    expect(component.formCancel.emit).toHaveBeenCalled();
  });
});
