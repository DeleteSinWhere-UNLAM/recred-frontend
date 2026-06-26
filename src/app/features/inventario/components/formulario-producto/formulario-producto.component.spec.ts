import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioProductoComponent, DatosFormularioProducto } from './formulario-producto.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Producto } from '../../models/producto.interface';
import { Categoria } from '../../models/categoria.interface';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('FormularioProductoComponent', () => {
  let component: FormularioProductoComponent;
  let fixture: ComponentFixture<FormularioProductoComponent>;

  const mockCategories: Categoria[] = [
    { id: 'c1', descripcion: 'Categoria 1', activo: true },
    { id: 'c2', descripcion: 'Categoria 2', activo: true }
  ];

  const mockProduct: Producto = {
    id: '1',
    nombre: 'Existing Producto',
    descripcion: 'Existing Desc',
    precio: 100,
    peso: 1,
    requierePreparacion: true,
    stockActual: 10,
    categoriaId: 'c1',
    categoriaNombre: 'Categoria 1'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormularioProductoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FormularioProductoComponent);
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
    expect(component.productForm.get('nombre')?.value).toBe('Existing Producto');
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
      nombre: 'a',
      descripcion: 'ab',
      precio: 0,
      peso: 0,
      stockActual: -1,
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

    component.productForm.patchValue({ nuevaCategoriaNombre: 'New Categoria' });
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

    const validData: DatosFormularioProducto = {
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

    expect(component.formSubmit.emit).toHaveBeenCalledWith({
      ...validData,
      urlImagen: null
    });
  });

  it('debería marcar todos los controles como tocados y no emitir si se envía un formulario inválido', () => {
    spyOn(component.formSubmit, 'emit');
    spyOn(component.productForm, 'markAllAsTouched').and.callThrough();

    component.productForm.patchValue({ nombre: '' });
    component.submitForm();

    expect(component.productForm.markAllAsTouched).toHaveBeenCalled();
    expect(component.formSubmit.emit).not.toHaveBeenCalled();
  });

  it('debería emitir el evento formCancel al cancelar el formulario', () => {
    spyOn(component.formCancel, 'emit');

    component.formCancel.emit();

    expect(component.formCancel.emit).toHaveBeenCalled();
  });
});
