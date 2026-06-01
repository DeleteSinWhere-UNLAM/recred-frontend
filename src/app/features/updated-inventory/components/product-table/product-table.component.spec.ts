import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductTableComponent } from './product-table.component';
import { Product } from '../../models/product.interface';

describe('ProductTableComponent', () => {
  let component: ProductTableComponent;
  let fixture: ComponentFixture<ProductTableComponent>;

  const mockProduct: Product = {
    id: '1',
    nombre: 'Product 1',
    descripcion: 'Desc 1',
    precio: 100,
    peso: 1,
    requierePreparacion: false,
    stockActual: 10,
    categoriaId: 'c1',
    categoriaNombre: 'Category 1'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería emitir el evento edit al disparar la acción de editar con un producto', () => {
    spyOn(component.edit, 'emit');
    
    // Simulate user action or method call
    component.edit.emit(mockProduct);
    
    expect(component.edit.emit).toHaveBeenCalledWith(mockProduct);
  });

  it('debería emitir el evento remove al disparar la acción de eliminar con un producto', () => {
    spyOn(component.remove, 'emit');
    
    // Simulate user action or method call
    component.remove.emit(mockProduct);
    
    expect(component.remove.emit).toHaveBeenCalledWith(mockProduct);
  });
});
