import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { Categoria } from '../../models/categoria.interface';
import { Producto } from '../../models/producto.interface';
import {
  DatosFormularioProducto,
  FormularioProductoComponent,
} from './formulario-producto.component';

class CategoriaMother {
  static crear(override: Partial<Categoria> = {}): Categoria {
    return {
      id: 'c1',
      descripcion: 'Categoria 1',
      activo: true,
      ...override,
    };
  }
}

class ProductoMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: '1',
      nombre: 'Existing Producto',
      descripcion: 'Existing Desc',
      precio: 100,
      peso: 1,
      requierePreparacion: true,
      stockActual: 10,
      categoriaId: 'c1',
      categoriaNombre: 'Categoria 1',
      ...override,
    };
  }
}

class DatosFormularioMother {
  static crearValidos(override: Partial<DatosFormularioProducto> = {}): DatosFormularioProducto {
    return {
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
      contiene_tacc: false,
      ...override,
    };
  }
}

describe('FormularioProductoComponent', () => {
  let component: FormularioProductoComponent;
  let fixture: ComponentFixture<FormularioProductoComponent>;
  let httpMock: HttpTestingController;

  const categorias: Categoria[] = [
    CategoriaMother.crear(),
    CategoriaMother.crear({ id: 'c2', descripcion: 'Categoria 2' }),
    CategoriaMother.crear({ id: 'c3', descripcion: 'Bebidas' }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormularioProductoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioProductoComponent);
    component = fixture.componentInstance;
    component.categories = categorias;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('inicializacion', () => {
    it('dado el componente sin producto, cuando se monta, deberia inicializar el form vacio para creacion', () => {
      expect(component.isEditing).toBeFalse();
      expect(component.productForm.get('nombre')?.value).toBe('');
      expect(component.productForm.get('requierePreparacion')?.value).toBeFalse();
    });

    it('dado un producto existente, cuando se pasa por input, deberia popular el form para edicion', () => {
      const producto = ProductoMother.crear();

      whenSeAsignaElProducto(producto);

      expect(component.isEditing).toBeTrue();
      expect(component.productForm.get('nombre')?.value).toBe('Existing Producto');
      expect(component.productForm.get('categoriaId')?.value).toBe('c1');
      expect(component.productForm.get('requierePreparacion')?.value).toBeTrue();
    });

    it('dado datos iniciales sin producto, cuando cambian los inputs, deberia precompletar el form de creacion', () => {
      component.product = null;
      component.datosIniciales = {
        nombre: 'Prod C',
        descripcion: 'Producto sugerido para incorporar al stock.',
        precio: 400,
        peso: 0,
        stockActual: 0,
      };

      component.ngOnChanges({
        datosIniciales: {
          currentValue: component.datosIniciales,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.isEditing).toBeFalse();
      expect(component.productForm.get('nombre')?.value).toBe('Prod C');
      expect(component.productForm.get('descripcion')?.value).toBe('Producto sugerido para incorporar al stock.');
      expect(component.productForm.get('precio')?.value).toBe(400);
      expect(component.productForm.get('stockActual')?.value).toBe(0);
    });
  });

  describe('validaciones del form', () => {
    it('dado campos obligatorios vacios, el form deberia ser invalido y marcar cada control con required', () => {
      component.productForm.patchValue({
        nombre: '',
        descripcion: '',
        precio: null,
        peso: null,
        stockActual: null,
        categoriaId: null,
      });

      expect(component.productForm.valid).toBeFalse();
      expect(component.productForm.get('nombre')?.hasError('required')).toBeTrue();
      expect(component.productForm.get('descripcion')?.hasError('required')).toBeTrue();
      expect(component.productForm.get('precio')?.hasError('required')).toBeTrue();
      expect(component.productForm.get('peso')?.hasError('required')).toBeTrue();
      expect(component.productForm.get('stockActual')?.hasError('required')).toBeTrue();
      expect(component.productForm.get('categoriaId')?.hasError('required')).toBeTrue();
    });

    it('dado valores fuera de rango, el form deberia marcar los errores minlength/min', () => {
      component.productForm.patchValue({
        nombre: 'a',
        descripcion: 'ab',
        precio: 0,
        peso: 0,
        stockActual: -1,
        categoriaId: 'c1',
      });

      expect(component.productForm.valid).toBeFalse();
      expect(component.productForm.get('nombre')?.hasError('minlength')).toBeTrue();
      expect(component.productForm.get('descripcion')?.hasError('minlength')).toBeTrue();
      expect(component.productForm.get('precio')?.hasError('min')).toBeTrue();
      expect(component.productForm.get('peso')?.hasError('min')).toBeTrue();
      expect(component.productForm.get('stockActual')?.hasError('min')).toBeTrue();
    });

    it('dado categoriaId NEW, nuevaCategoriaNombre deberia ser requerida', () => {
      component.productForm.patchValue({ categoriaId: 'NEW' });
      fixture.detectChanges();

      const nuevaCategoriaCtrl = component.productForm.get('nuevaCategoriaNombre');
      expect(nuevaCategoriaCtrl?.hasError('required')).toBeTrue();

      component.productForm.patchValue({ nuevaCategoriaNombre: 'New Categoria' });
      expect(nuevaCategoriaCtrl?.hasError('required')).toBeFalse();
    });

    it('dado un categoriaId existente, nuevaCategoriaNombre no deberia ser requerida', () => {
      component.productForm.patchValue({ categoriaId: 'c1' });
      fixture.detectChanges();

      expect(component.productForm.get('nuevaCategoriaNombre')?.hasError('required')).toBeFalse();
    });
  });

  describe('submit del form', () => {
    it('dado un form valido, cuando hago submit, deberia emitir formSubmit con los datos y urlImagen null', () => {
      const spyEmit = spyOn(component.formSubmit, 'emit');
      const datos = DatosFormularioMother.crearValidos();

      component.productForm.patchValue(datos);
      expect(component.productForm.valid).toBeTrue();

      component.submitForm();

      expect(spyEmit).toHaveBeenCalledWith({ ...datos, urlImagen: null });
    });

    it('dado un form invalido, cuando hago submit, deberia marcar todo como touched y no emitir', () => {
      const spyEmit = spyOn(component.formSubmit, 'emit');
      const spyMarkAll = spyOn(component.productForm, 'markAllAsTouched').and.callThrough();

      component.productForm.patchValue({ nombre: '' });
      component.submitForm();

      expect(spyMarkAll).toHaveBeenCalled();
      expect(spyEmit).not.toHaveBeenCalled();
    });
  });

  describe('cancelacion', () => {
    it('dado el componente, cuando emito formCancel, deberia notificarlo', () => {
      const spyEmit = spyOn(component.formCancel, 'emit');

      component.formCancel.emit();

      expect(spyEmit).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges con clasificacionesSalud', () => {
    it('dado un producto sin "Sin Azúcar", cuando se asigna, contiene_azucar deberia ser true', () => {
      const producto = ProductoMother.crear({
        clasificacionesSalud: [{ id: 'x', descripcion: 'Con Azúcar' }],
      });

      whenSeAsignaElProducto(producto);

      expect(component.productForm.get('contiene_azucar')?.value).toBeTrue();
      expect(component.productForm.get('contiene_tacc')?.value).toBeTrue();
      expect(component.productForm.get('contiene_lactosa')?.value).toBeFalse();
    });

    it('dado un producto con "Contiene Lácteos" y "Sin Azúcar" y "Sin TACC", deberia setear los flags correctos', () => {
      const producto = ProductoMother.crear({
        clasificacionesSalud: [
          { id: '1', descripcion: 'Contiene Lácteos' },
          { id: '2', descripcion: 'Sin Azúcar' },
          { id: '3', descripcion: 'Sin TACC' },
        ],
      });

      whenSeAsignaElProducto(producto);

      expect(component.productForm.get('contiene_lactosa')?.value).toBeTrue();
      expect(component.productForm.get('contiene_azucar')?.value).toBeFalse();
      expect(component.productForm.get('contiene_tacc')?.value).toBeFalse();
    });

    it('dado un producto sin clasificacionesSalud, deberia dejar los flags en false', () => {
      const producto = ProductoMother.crear({ clasificacionesSalud: undefined });

      whenSeAsignaElProducto(producto);

      expect(component.productForm.get('contiene_azucar')?.value).toBeFalse();
      expect(component.productForm.get('contiene_lactosa')?.value).toBeFalse();
      expect(component.productForm.get('contiene_tacc')?.value).toBeFalse();
    });
  });

  describe('ngOnChanges y deteccion de bebida', () => {
    it('dado un producto de la categoria Bebidas por id, deberia marcar isBeverage true', () => {
      const producto = ProductoMother.crear({ categoriaId: 'c3', categoriaNombre: 'Bebidas' });

      whenSeAsignaElProducto(producto);

      expect(component.isBeverage()).toBeTrue();
    });

    it('dado un producto sin categoriaId pero con categoriaNombre "Infusion", deberia marcar isBeverage true', () => {
      const producto = ProductoMother.crear({
        categoriaId: null,
        categoriaNombre: 'Infusion casera',
      });

      whenSeAsignaElProducto(producto);

      expect(component.isBeverage()).toBeTrue();
    });

    it('dado que escribo "Bebidas" en nuevaCategoriaNombre con NEW, deberia marcar isBeverage true', () => {
      component.productForm.patchValue({ categoriaId: 'NEW', nuevaCategoriaNombre: 'Bebidas' });

      expect(component.isBeverage()).toBeTrue();
    });

    it('dado que escribo "Bebidas" con una categoria existente, no deberia marcar isBeverage', () => {
      component.productForm.patchValue({ categoriaId: 'c1', nuevaCategoriaNombre: 'Bebidas' });

      expect(component.isBeverage()).toBeFalse();
    });
  });

  describe('ngOnChanges cuando se remueve el producto', () => {
    it('dado un producto asignado, cuando se pasa a null, deberia resetear el form y el preview', () => {
      const producto = ProductoMother.crear({ urlImagen: 'https://img/uno.png' });
      whenSeAsignaElProducto(producto);
      expect(component.imagePreview()).toBe('https://img/uno.png');

      component.product = null;
      component.ngOnChanges({
        product: {
          currentValue: null,
          previousValue: producto,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.productForm.get('nombre')?.value).toBeNull();
      expect(component.productForm.get('requierePreparacion')?.value).toBeFalse();
      expect(component.imagePreview()).toBeNull();
    });
  });

  describe('onFileSelected y uploadImage', () => {
    it('dado que no hay archivos en el input, no deberia disparar la subida', () => {
      const input = document.createElement('input');
      input.type = 'file';
      const event = { target: input } as unknown as Event;

      component.onFileSelected(event);

      httpMock.expectNone(`${environment.apiUrl}/load-stock/upload-image`);
      expect(component.isUploadingImage()).toBeFalse();
    });

    it('dado que subo una imagen y el backend responde ok, deberia patchear urlImagen y limpiar el flag', () => {
      const event = givenFileSelectedEvent(new File(['foo'], 'foto.png', { type: 'image/png' }));

      component.onFileSelected(event);

      expect(component.isUploadingImage()).toBeTrue();
      const req = httpMock.expectOne(`${environment.apiUrl}/load-stock/upload-image`);
      expect(req.request.method).toBe('POST');
      req.flush({ url_imagen: 'https://cloud/foto.png' });

      expect(component.productForm.get('urlImagen')?.value).toBe('https://cloud/foto.png');
      expect(component.imagePreview()).toBe('https://cloud/foto.png');
      expect(component.isUploadingImage()).toBeFalse();
    });

    it('dado que el backend responde con error, deberia limpiar el flag sin patchear urlImagen', () => {
      const event = givenFileSelectedEvent(new File(['foo'], 'foto.png', { type: 'image/png' }));

      component.onFileSelected(event);

      const req = httpMock.expectOne(`${environment.apiUrl}/load-stock/upload-image`);
      req.flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.isUploadingImage()).toBeFalse();
      expect(component.productForm.get('urlImagen')?.value).toBeNull();
    });
  });

  describe('getErrorMessage', () => {
    it('dado un control sin errores, deberia devolver string vacio', () => {
      component.productForm.get('nombre')?.setValue('Nombre valido');

      expect(component.getErrorMessage('nombre')).toBe('');
    });

    it('dado un campo required, deberia devolver el mensaje de campo obligatorio', () => {
      component.productForm.get('nombre')?.setValue('');
      component.productForm.get('nombre')?.markAsTouched();

      expect(component.getErrorMessage('nombre')).toBe('Este campo es obligatorio');
    });

    it('dado un campo con minlength, deberia devolver el mensaje con la longitud requerida', () => {
      component.productForm.get('nombre')?.setValue('a');

      expect(component.getErrorMessage('nombre')).toBe('Mínimo 2 caracteres');
    });

    it('dado un campo con min, deberia devolver el mensaje con el minimo', () => {
      component.productForm.get('precio')?.setValue(0);

      expect(component.getErrorMessage('precio')).toBe('El valor mínimo es 0.01');
    });

    it('dado un campo con un error desconocido, deberia devolver "Valor inválido"', () => {
      const control = component.productForm.get('nombre');
      control?.setErrors({ desconocido: true });

      expect(component.getErrorMessage('nombre')).toBe('Valor inválido');
    });

    it('dado un field inexistente, deberia devolver string vacio', () => {
      expect(component.getErrorMessage('inexistente')).toBe('');
    });
  });

  describe('hasError', () => {
    it('dado un control invalido y touched, deberia devolver true', () => {
      const control = component.productForm.get('nombre');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.hasError('nombre')).toBeTrue();
    });

    it('dado un control valido, deberia devolver false', () => {
      const control = component.productForm.get('nombre');
      control?.setValue('Nombre valido');
      control?.markAsTouched();

      expect(component.hasError('nombre')).toBeFalse();
    });

    it('dado un control invalido pero no touched, deberia devolver false', () => {
      component.productForm.get('nombre')?.setValue('');

      expect(component.hasError('nombre')).toBeFalse();
    });

    it('dado un field inexistente, deberia devolver false', () => {
      expect(component.hasError('inexistente')).toBeFalse();
    });
  });

  function givenFileSelectedEvent(file: File): Event {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      value: {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      },
    });
    spyOn(FileReader.prototype, 'readAsDataURL').and.stub();
    return { target: input } as unknown as Event;
  }

  function whenSeAsignaElProducto(producto: Producto): void {
    component.product = producto;
    component.ngOnChanges({
      product: {
        currentValue: producto,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
  }
});
