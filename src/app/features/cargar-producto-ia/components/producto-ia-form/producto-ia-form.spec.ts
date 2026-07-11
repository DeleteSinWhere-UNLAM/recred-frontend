import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CategoriaMother,
  RespuestaProductoIaMother,
} from '../../cargar-producto-ia.mother';
import { RespuestaProductoIa } from '../../models/producto-ia-response.interface';
import { ProductoIaForm } from './producto-ia-form';

const ID_SIN_TACC = '15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8';
const ID_SIN_AZUCAR = '7e113952-93ca-4797-a80d-54f3a31b2165';
const ID_CONTIENE_LACTEOS = 'a087290b-474e-4a8c-9e5d-ce1c375d4009';
const ID_TIENE_MANI = 'mani-id';
const ID_CONTIENE_PESCADO = 'pescado-id';

describe('ProductoIaForm', () => {
  const BUFFET_ID = 'buffet-test-123';

  let component: ProductoIaForm;
  let fixture: ComponentFixture<ProductoIaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoIaForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoIaForm);
    component = fixture.componentInstance;
    component.buffetId = BUFFET_ID;
    component.categories = [CategoriaMother.crear()];
    component.healthClassifications = [
      { id: ID_SIN_TACC, descripcion: 'Sin TACC' },
      { id: ID_SIN_AZUCAR, descripcion: 'Sin Azúcar' },
      { id: ID_CONTIENE_LACTEOS, descripcion: 'Contiene Lácteos' },
      { id: ID_TIENE_MANI, descripcion: 'Tiene Maní' },
      { id: ID_CONTIENE_PESCADO, descripcion: 'Contiene Pescado' },
    ];
    fixture.detectChanges();
  });

  describe('Estado inicial', () => {
    it('dado el form recien creado, deberia arrancar invalido y sin errores tocados', () => {
      expect(component.productForm.valid).toBeFalse();
      expect(component.hasError('nombre')).toBeFalse();
    });
  });

  describe('prefill desde RespuestaProductoIa', () => {
    it('dado un peso en "120g", cuando llega prefillData, deberia convertirlo a 0.12 kg', () => {
      const data = RespuestaProductoIaMother.crearConAlergenos({ peso: '120g' });

      whenPrefill(data);

      expect(component.productForm.value.peso).toBeCloseTo(0.12, 5);
      expect(component.productForm.value.nombre).toBe('Alfajor de chocolate');
      expect(component.productForm.value.contiene_azucar).toBeTrue();
      expect(component.productForm.value.clasificacionesSaludIds).toEqual([ID_CONTIENE_LACTEOS]);
    });

    it('dado un peso en kilogramos, cuando llega prefillData, deberia mantenerlo tal cual', () => {
      const data = RespuestaProductoIaMother.crear({ peso: '1.5kg' });

      whenPrefill(data);

      expect(component.productForm.value.peso).toBeCloseTo(1.5, 5);
    });

    it('dado un peso invalido, cuando llega prefillData, deberia setearlo en 0', () => {
      const data = RespuestaProductoIaMother.crear({ peso: 'sin peso' });

      whenPrefill(data);

      expect(component.productForm.value.peso).toBe(0);
    });

    it('dado un producto precargado, cuando prefillData vuelve a null, deberia resetear el formulario', () => {
      const data = RespuestaProductoIaMother.crearConAlergenos({ url_imagen: 'https://img.test/prod.png' });
      whenPrefill(data);
      component.productForm.patchValue({
        precio: 1500,
        stockActual: 8,
        categoriaId: 'cat-1',
      });

      whenPrefillSeLimpia(data);

      expect(component.productForm.value).toEqual(jasmine.objectContaining({
        nombre: '',
        descripcion: '',
        peso: 0,
        precio: 0,
        stockActual: 0,
        categoriaId: null,
        clasificacionesSaludIds: [],
        urlImagen: '',
      }));
      expect(component.productForm.pristine).toBeTrue();
      expect(component.productForm.untouched).toBeTrue();
    });
  });

  describe('categoria NEW dispara validacion', () => {
    it('dado categoriaId = NEW, cuando cambia, deberia hacer requerido a nuevaCategoriaNombre', () => {
      whenCambioCategoriaA('NEW');

      const control = component.productForm.get('nuevaCategoriaNombre');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('dado categoriaId con id normal, cuando cambia desde NEW, deberia limpiar validacion y valor', () => {
      whenCambioCategoriaA('NEW');
      component.productForm.get('nuevaCategoriaNombre')?.setValue('Dulces');

      whenCambioCategoriaA('cat-1');

      const control = component.productForm.get('nuevaCategoriaNombre');
      expect(control?.hasError('required')).toBeFalse();
      expect(control?.value).toBe('');
    });
  });

  describe('submitForm', () => {
    it('dado un form valido con categoriaId NEW, cuando submit, deberia emitir save con nuevaCategoriaNombre y categoriaId null', () => {
      spyOn(component.save, 'emit');
      llenarFormularioValido('NEW', 'Dulces');

      component.submitForm();

      const emitido = ultimoEmit();
      expect(emitido.categoriaId).toBeNull();
      expect(emitido.nuevaCategoriaNombre).toBe('Dulces');
      expect(emitido.buffetId).toBe(BUFFET_ID);
    });

    it('dado un form valido con categoria existente, cuando submit, deberia mandar categoriaId y no nuevaCategoriaNombre', () => {
      spyOn(component.save, 'emit');
      llenarFormularioValido('cat-1');

      component.submitForm();

      const emitido = ultimoEmit();
      expect(emitido.categoriaId).toBe('cat-1');
      expect(emitido.nuevaCategoriaNombre).toBe('');
    });

    it('dado un producto con clasificaciones seleccionadas, cuando submit, deberia mandarlas en el request', () => {
      spyOn(component.save, 'emit');
      llenarFormularioValido('cat-1');
      component.productForm.patchValue({
        clasificacionesSaludIds: [ID_SIN_TACC, ID_SIN_AZUCAR, ID_CONTIENE_PESCADO],
      });

      component.submitForm();

      expect(ultimoEmit().clasificacionesSaludIds).toEqual([
        ID_SIN_TACC,
        ID_SIN_AZUCAR,
        ID_CONTIENE_PESCADO,
      ]);
    });

    it('dado que marco una clasificacion manualmente, cuando submit, deberia incluirla', () => {
      spyOn(component.save, 'emit');
      llenarFormularioValido('cat-1');
      component.toggleHealthClassification(
        ID_CONTIENE_LACTEOS,
        { target: { checked: true } } as unknown as Event,
      );

      component.submitForm();

      expect(ultimoEmit().clasificacionesSaludIds).toContain(ID_CONTIENE_LACTEOS);
    });

    it('dado un form invalido, cuando submit, no deberia emitir y deberia marcar los controles como tocados', () => {
      spyOn(component.save, 'emit');
      component.productForm.patchValue({ nombre: '' });

      component.submitForm();

      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.productForm.touched).toBeTrue();
    });
  });

  describe('mensajes de error', () => {
    it('dado un campo requerido vacio y tocado, hasError deberia ser true y el mensaje deberia ser "Este campo es obligatorio"', () => {
      const control = component.productForm.get('nombre');
      control?.markAsTouched();

      expect(component.hasError('nombre')).toBeTrue();
      expect(component.getErrorMessage('nombre')).toBe('Este campo es obligatorio');
    });

    it('dado un valor por debajo del minimo, el mensaje deberia incluir el minimo permitido', () => {
      const control = component.productForm.get('precio');
      control?.setValue(0);
      control?.markAsTouched();

      expect(component.getErrorMessage('precio')).toContain('0.01');
    });

    it('dado un campo inexistente, getErrorMessage deberia devolver string vacio', () => {
      expect(component.getErrorMessage('inexistente')).toBe('');
    });
  });

  function whenPrefill(data: RespuestaProductoIa): void {
    component.prefillData = data;
    component.ngOnChanges({
      prefillData: new SimpleChange(null, data, true),
    });
  }

  function whenPrefillSeLimpia(dataAnterior: RespuestaProductoIa): void {
    component.prefillData = null;
    component.ngOnChanges({
      prefillData: new SimpleChange(dataAnterior, null, false),
    });
  }

  function whenCambioCategoriaA(valor: string): void {
    component.productForm.get('categoriaId')?.setValue(valor);
  }

  function llenarFormularioValido(categoriaId: string, nuevaCategoriaNombre = ''): void {
    component.productForm.patchValue({
      nombre: 'Galletas',
      descripcion: 'De arroz',
      peso: 0.12,
      precio: 100,
      stockActual: 10,
      categoriaId,
      nuevaCategoriaNombre,
      requierePreparacion: false,
      contiene_azucar: false,
      contiene_mani: false,
      contiene_lactosa: false,
      contiene_tacc: false,
    });
  }

  function ultimoEmit() {
    return (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
  }
});
