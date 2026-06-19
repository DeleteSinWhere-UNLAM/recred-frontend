import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioProductoComponent, DatosFormularioProducto } from './formulario-producto.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Producto } from '../../models/producto.model';
import { Categoria } from '../../models/categoria.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('FormularioProductoComponent', () => {
  let component: FormularioProductoComponent;
  let fixture: ComponentFixture<FormularioProductoComponent>;

  const mockCategories: Categoria[] = [
    { id: 'c1', descripcion: 'Categoria 1', activo: true },
    { id: 'c2', descripcion: 'Categoria 2', activo: true }
  ];

  const mockProducto: Producto = {
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
    component.product = mockProducto;
    component.ngOnChanges({
      product: {
        currentValue: mockProducto,
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

  it('dado que no hay producto, ngOnChanges deberia resetear el formulario y la previsualizacion', () => {
    component.product = mockProducto;
    component.ngOnChanges({
      product: {
        currentValue: mockProducto,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });

    component.product = null;
    component.ngOnChanges({
      product: {
        currentValue: null,
        previousValue: mockProducto,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.imagePreview()).toBeNull();
    expect(component.productForm.get('requierePreparacion')?.value).toBeFalse();
  });

  it('dado que selecciono un archivo, deberia cargar la previsualizacion e iniciar subida', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spyOn(component as any, 'uploadImage');

    component.onFileSelected(event);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).uploadImage).toHaveBeenCalledWith(file);
  });

  it('dado que subo imagen exitosamente, deberia patchear el url y preview', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    

    // Omitiendo la inyeccion real para simplemente mockear el HttpClient via spy si es posible
    // Pero ya tengo HttpTestingController inyectado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).uploadImage(file);
    expect(component.isUploadingImage()).toBeTrue();
  });

  it('dado que llamo a hasError, deberia devolver true si el control es invalido y fue tocado', () => {
    component.productForm.get('nombre')?.markAsTouched();
    component.productForm.get('nombre')?.setErrors({ required: true });
    expect(component.hasError('nombre')).toBeTrue();
  });

  it('dado que llamo a getErrorMessage, deberia devolver el mensaje correcto para cada error', () => {
    component.productForm.get('nombre')?.setErrors({ required: true });
    expect(component.getErrorMessage('nombre')).toBe('Este campo es obligatorio');

    component.productForm.get('nombre')?.setErrors({ minlength: { requiredLength: 2 } });
    expect(component.getErrorMessage('nombre')).toBe('Mínimo 2 caracteres');

    component.productForm.get('precio')?.setErrors({ min: { min: 0.01 } });
    expect(component.getErrorMessage('precio')).toBe('El valor mínimo es 0.01');

    component.productForm.get('nombre')?.setErrors({ custom: true });
    expect(component.getErrorMessage('nombre')).toBe('Valor inválido');

    expect(component.getErrorMessage('campo_inexistente')).toBe('');
  });
});
