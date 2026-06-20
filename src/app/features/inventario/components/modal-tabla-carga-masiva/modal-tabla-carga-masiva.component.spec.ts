import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalTablaCargaMasivaComponent } from './modal-tabla-carga-masiva.component';
import { ToastService } from '../../../../shared/services/toast.service';

describe('ModalTablaCargaMasivaComponent', () => {
  let component: ModalTablaCargaMasivaComponent;
  let fixture: ComponentFixture<ModalTablaCargaMasivaComponent>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [ModalTablaCargaMasivaComponent, ReactiveFormsModule],
      providers: [
        { provide: ToastService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalTablaCargaMasivaComponent);
    component = fixture.componentInstance;
    toastSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    fixture.detectChanges();
  });

  it('debería crear', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges debería reconstruir el form array', () => {
    const products = [{ nombre: 'P1', precio: 10, categoriaId: '1', requierePreparacion: false }];
    component.prefilledProducts = products as any;
    component.ngOnChanges({
      prefilledProducts: {
        currentValue: products,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true
      }
    });
    expect(component.productsArray.length).toBe(1);
    expect(component.productsArray.at(0).get('nombre')?.value).toBe('P1');
  });

  it('addProductRow y removeProductRow deberían modificar el array', () => {
    component.addProductRow();
    expect(component.productsArray.length).toBe(1);
    
    component.removeProductRow(0);
    expect(component.productsArray.length).toBe(0);
  });

  it('onFileChange debería emitir fileSelected', () => {
    spyOn(component.fileSelected, 'emit');
    const file = new File([''], 'test.csv');
    const event = { target: { files: [file] } } as unknown as Event;
    
    component.onFileChange(event);
    
    expect(component.fileSelected.emit).toHaveBeenCalledWith(file);
  });

  it('onCancel debería emitir closeModal', () => {
    spyOn(component.closeModal, 'emit');
    component.onCancel();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('onSave debería emitir saveProducts si el form es válido', () => {
    spyOn(component.saveProducts, 'emit');
    component.addProductRow({ nombre: 'P1', precio: 10, categoriaId: '1' } as any);
    component.onSave();
    
    expect(component.saveProducts.emit).toHaveBeenCalled();
  });

  it('onSave debería mostrar error si el form es inválido', () => {
    component.addProductRow(); // Fila vacía, inválida
    component.onSave();
    expect(toastSpy.mostrar).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('onSave debería mostrar error si no hay productos', () => {
    component.onSave();
    expect(toastSpy.mostrar).toHaveBeenCalledWith('No hay productos para guardar', 'error');
  });

  it('debería cambiar validadores cuando categoriaId es NEW', () => {
    component.addProductRow();
    const row = component.productsArray.at(0);
    
    row.get('categoriaId')?.setValue('NEW');
    expect(row.get('nuevaCategoriaNombre')?.hasError('required')).toBeTrue();
    
    row.get('categoriaId')?.setValue('123');
    expect(row.get('nuevaCategoriaNombre')?.hasError('required')).toBeFalse();
  });
});
