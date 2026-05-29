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
      marca: 'Oreo',
      peso: '120g',
      contiene_azucar: 'si',
      contiene_lactosa: 'si',
      contiene_mani: 'no'
    };

    component.prefillData = mockData;
    component.ngOnChanges({
      prefillData: new SimpleChange(null, mockData, true)
    });

    expect(component.productForm.value).toEqual(mockData);
  });

  it('debería emitir el evento save cuando el formulario es válido y se envía', () => {
    spyOn(component.save, 'emit');
    
    component.productForm.patchValue({
      nombre: 'Galletas',
      marca: 'Oreo',
      peso: '120g',
      contiene_azucar: 'si',
      contiene_lactosa: 'si',
      contiene_mani: 'no'
    });

    component.submitForm();
    expect(component.save.emit).toHaveBeenCalledWith(component.productForm.value);
  });

  it('NO debería emitir el evento save si el formulario es inválido', () => {
    spyOn(component.save, 'emit');
    
    component.productForm.patchValue({
      nombre: '', // inválido
      marca: 'Oreo'
    });

    component.submitForm();
    expect(component.save.emit).not.toHaveBeenCalled();
    expect(component.productForm.touched).toBeTrue();
  });
});
