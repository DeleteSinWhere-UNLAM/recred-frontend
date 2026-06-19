import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AiProductForm } from './ai-product-form';
import { SimpleChange } from '@angular/core';

describe('AiProductForm', () => {
  let component: AiProductForm;
  let fixture: ComponentFixture<AiProductForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, AiProductForm]
    }).compileComponents();

    fixture = TestBed.createComponent(AiProductForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('ngOnChanges', () => {
    it('dado que no hay prefillData o es null, no deberia cambiar el formulario', () => {
      const initialValue = component.productForm.value;
      
      component.ngOnChanges({
        prefillData: new SimpleChange(null, null, true)
      });

      expect(component.productForm.value).toEqual(initialValue);
    });

    it('dado que hay prefillData valido, deberia popular el formulario y parsear el peso correctamente', () => {
      component.prefillData = {
        nombre: 'Galletas',
        descripcion: 'Dulces',
        peso: '500g',
        contiene_azucar: true,
        contiene_mani: false,
        contiene_lactosa: false,
        contiene_tacc: true,
        url_imagen: 'http://test.com/img.jpg'
      };

      component.ngOnChanges({
        prefillData: new SimpleChange(null, component.prefillData, true)
      });

      expect(component.productForm.value.nombre).toBe('Galletas');
      expect(component.productForm.value.descripcion).toBe('Dulces');
      expect(component.productForm.value.peso).toBe(0.5);
      expect(component.productForm.value.contiene_azucar).toBe(true);
      expect(component.productForm.value.contiene_mani).toBe(false);
      expect(component.productForm.value.contiene_lactosa).toBe(false);
      expect(component.productForm.value.contiene_tacc).toBe(true);
      expect(component.productForm.value.urlImagen).toBe('http://test.com/img.jpg');
    });

    it('dado que el peso esta en kilogramos o litros, deberia mantener el valor original numerico', () => {
      component.prefillData = {
        nombre: 'Leche',
        descripcion: '',
        peso: '1.5 L',
        contiene_azucar: false,
        contiene_mani: false,
        contiene_lactosa: true,
        contiene_tacc: false,
        url_imagen: undefined
      };

      component.ngOnChanges({
        prefillData: new SimpleChange(null, component.prefillData, true)
      });

      expect(component.productForm.value.peso).toBe(1.5);
      expect(component.productForm.value.urlImagen).toBe('');
    });

    it('dado que el peso no es numerico, deberia poner cero', () => {
      component.prefillData = {
        nombre: 'Leche',
        descripcion: '',
        peso: 'invalido',
        contiene_azucar: false,
        contiene_mani: false,
        contiene_lactosa: true,
        contiene_tacc: false,
        url_imagen: undefined
      };

      component.ngOnChanges({
        prefillData: new SimpleChange(null, component.prefillData, true)
      });

      expect(component.productForm.value.peso).toBe(0);
    });
  });

  describe('ngOnInit y categoriaId valueChanges', () => {
    it('dado que se selecciona una categoria existente, la nueva categoria no deberia ser requerida', () => {
      const categoriaCtrl = component.productForm.get('categoriaId');
      const nuevaCategoriaCtrl = component.productForm.get('nuevaCategoriaNombre');

      nuevaCategoriaCtrl?.setValue('Deberia borrarse');
      categoriaCtrl?.setValue('uuid-existente');

      expect(nuevaCategoriaCtrl?.hasValidator(jasmine.any(Function) as unknown)).toBeFalse();
      expect(nuevaCategoriaCtrl?.value).toBe('');
      expect(nuevaCategoriaCtrl?.valid).toBeTrue();
    });

    it('dado que se selecciona la opcion NEW, la nueva categoria deberia ser obligatoria', () => {
      const categoriaCtrl = component.productForm.get('categoriaId');
      const nuevaCategoriaCtrl = component.productForm.get('nuevaCategoriaNombre');

      categoriaCtrl?.setValue('NEW');

      expect(nuevaCategoriaCtrl?.valid).toBeFalse();
      
      nuevaCategoriaCtrl?.setValue('Bebidas');
      expect(nuevaCategoriaCtrl?.valid).toBeTrue();
    });
  });

  describe('hasError y getErrorMessage', () => {
    it('dado que el campo no ha sido tocado, no deberia tener error visible', () => {
      const field = 'nombre';
      expect(component.hasError(field)).toBeFalse();
    });

    it('dado que el campo es tocado y es invalido, deberia tener error visible', () => {
      const field = 'nombre';
      const control = component.productForm.get(field);
      control?.markAsTouched();
      expect(component.hasError(field)).toBeTrue();
      expect(component.getErrorMessage(field)).toBe('Este campo es obligatorio');
    });

    it('dado que el campo tiene error de min, deberia mostrar mensaje especifico', () => {
      const field = 'precio';
      const control = component.productForm.get(field);
      control?.setValue(0);
      control?.markAsTouched();
      expect(component.hasError(field)).toBeTrue();
      expect(component.getErrorMessage(field)).toBe('El valor mínimo es 0.01');
    });

    it('dado que el campo tiene un error desconocido, deberia mostrar mensaje generico', () => {
      const field = 'nombre';
      const control = component.productForm.get(field);
      control?.setErrors({ unknownError: true });
      control?.markAsTouched();
      expect(component.hasError(field)).toBeTrue();
      expect(component.getErrorMessage(field)).toBe('Valor inválido');
    });

    it('dado que se solicita un campo inexistente, deberia retornar false y string vacio', () => {
      expect(component.hasError('inexistente')).toBeFalse();
      expect(component.getErrorMessage('inexistente')).toBe('');
    });
  });

  describe('submitForm', () => {
    it('dado que el formulario es invalido, deberia marcar todo como tocado y no emitir', () => {
      spyOn(component.save, 'emit');
      component.submitForm();
      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.productForm.get('nombre')?.touched).toBeTrue();
    });

    it('dado que el formulario es valido pero no hay buffetId, no deberia emitir', () => {
      spyOn(component.save, 'emit');
      component.productForm.patchValue({
        nombre: 'Test',
        descripcion: 'Test desc',
        peso: 1,
        precio: 100,
        stockActual: 10,
        categoriaId: 'cat-1'
      });
      component.buffetId = '';

      component.submitForm();
      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('dado que el formulario es valido, deberia mapear clasificaciones de salud y emitir correctamente con categoria existente', () => {
      spyOn(component.save, 'emit');
      component.buffetId = 'buffet-test';
      component.productForm.patchValue({
        nombre: 'Alfajor',
        descripcion: 'Dulce',
        peso: 0.05,
        precio: 50,
        stockActual: 10,
        categoriaId: 'cat-existente',
        nuevaCategoriaNombre: '',
        requierePreparacion: false,
        contiene_azucar: true,
        contiene_mani: false,
        contiene_lactosa: true,
        contiene_tacc: true,
        urlImagen: 'url'
      });

      component.submitForm();

      expect(component.save.emit).toHaveBeenCalledWith({
        nombre: 'Alfajor',
        descripcion: 'Dulce',
        precio: 50,
        peso: 0.05,
        requierePreparacion: false,
        categoriaId: 'cat-existente',
        nuevaCategoriaNombre: '',
        buffetId: 'buffet-test',
        stockActual: 10,
        clasificacionesSaludIds: ['a087290b-474e-4a8c-9e5d-ce1c375d4009'],
        tiposIds: [],
        urlImagen: 'url'
      });
    });

    it('dado que se usa una nueva categoria y alimentos saludables, deberia mapear y emitir', () => {
      spyOn(component.save, 'emit');
      component.buffetId = 'buffet-test';
      component.productForm.patchValue({
        nombre: 'Manzana',
        descripcion: 'Fruta',
        peso: 0.2,
        precio: 30,
        stockActual: 5,
        categoriaId: 'NEW',
        nuevaCategoriaNombre: 'Frutas',
        requierePreparacion: false,
        contiene_azucar: false,
        contiene_mani: false,
        contiene_lactosa: false,
        contiene_tacc: false,
        urlImagen: ''
      });

      component.submitForm();

      expect(component.save.emit).toHaveBeenCalledWith({
        nombre: 'Manzana',
        descripcion: 'Fruta',
        precio: 30,
        peso: 0.2,
        requierePreparacion: false,
        categoriaId: null,
        nuevaCategoriaNombre: 'Frutas',
        buffetId: 'buffet-test',
        stockActual: 5,
        clasificacionesSaludIds: [
          '15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8',
          '7e113952-93ca-4797-a80d-54f3a31b2165'
        ],
        tiposIds: [],
        urlImagen: ''
      });
    });
  });
});
