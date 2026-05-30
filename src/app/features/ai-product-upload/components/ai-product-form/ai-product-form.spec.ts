import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiProductForm } from './ai-product-form';
import { SimpleChange } from '@angular/core';

describe('AiProductForm', () => {
  let component: AiProductForm;
  let fixture: ComponentFixture<AiProductForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiProductForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiProductForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería autocompletar el formulario cuando cambia prefillData', () => {
    const mockData = {
      nombre: 'Galletas',
      descripcion: 'Galletas de chocolate',
      peso: '120g',
      contiene_azucar: true,
      contiene_lactosa: true,
      contiene_mani: false,
      contiene_tacc: false
    };

    component.prefillData = mockData;
    component.ngOnChanges({
      prefillData: new SimpleChange(null, mockData, true)
    });

    expect(component.productForm.value.nombre).toBe('Galletas');
    expect(component.productForm.value.descripcion).toBe('Galletas de chocolate');
    expect(component.productForm.value.peso).toBe(0.12);
    expect(component.productForm.value.contiene_azucar).toBeTrue();
    expect(component.productForm.value.contiene_lactosa).toBeTrue();
    expect(component.productForm.value.contiene_mani).toBeFalse();
  });

  it('debería emitir el evento save cuando el formulario es válido y se envía', () => {
    spyOn(component.save, 'emit');
    
    component.productForm.patchValue({
      nombre: 'Galletas',
      descripcion: 'Galletas de chocolate',
      peso: 0.12,
      precio: 100,
      stockActual: 10,
      nuevaCategoriaNombre: 'Dulces',
      requierePreparacion: false,
      contiene_azucar: true,
      contiene_lactosa: true,
      contiene_mani: false,
      contiene_tacc: false
    });

    component.submitForm();
    
    expect(component.save.emit).toHaveBeenCalled();
    const emittedRequest = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedRequest.nombre).toBe('Galletas');
    expect(emittedRequest.descripcion).toBe('Galletas de chocolate');
    expect(emittedRequest.peso).toBe(0.12);
    expect(emittedRequest.nuevaCategoriaNombre).toBe('Galletita');
    expect(emittedRequest.buffetId).toBe('ebfc7afc-6b2e-46a6-ba8f-bb2902a6bfd9');
    expect(emittedRequest.clasificacionesSaludIds).toEqual(['214e9d21-b049-43af-be09-08fb0b445828']);
  });

  it('NO debería emitir el evento save si el formulario es inválido', () => {
    spyOn(component.save, 'emit');
    
    component.productForm.patchValue({
      nombre: '', // inválido
      descripcion: 'Galletas de chocolate'
    });

    component.submitForm();
    expect(component.save.emit).not.toHaveBeenCalled();
    expect(component.productForm.touched).toBeTrue();
  });
});
