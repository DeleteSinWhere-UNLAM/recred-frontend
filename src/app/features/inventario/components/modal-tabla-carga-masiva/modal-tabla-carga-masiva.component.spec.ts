import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalTablaCargaMasivaComponent } from './modal-tabla-carga-masiva.component';
import { RespuestaProductoMasivo } from '../../services/carga-masiva.service';

describe('ModalTablaCargaMasivaComponent', () => {
  let component: ModalTablaCargaMasivaComponent;
  let fixture: ComponentFixture<ModalTablaCargaMasivaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalTablaCargaMasivaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalTablaCargaMasivaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que inicializo la tabla sin prefill, el array debe estar vacio', () => {
    expect(component.productsArray.length).toBe(0);
  });

  it('dado que asigno un prefillProducts, debe reconstruir el form array', () => {
    const products: RespuestaProductoMasivo[] = [
      {
        nombre: 'Agua',
        descripcion: 'Mineral',
        precio: 500,
        peso: 500,
        requierePreparacion: false,
        categoriaId: 'cat-123',
        nuevaCategoriaNombre: '',
        stockActual: 10,
        saludEtiquetasIds: [],
        tipoEtiquetasIds: []
      }
    ];

    component.prefilledProducts = products;
    component.ngOnChanges({
      prefilledProducts: {
        currentValue: products,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true
      }
    });

    expect(component.productsArray.length).toBe(1);
    expect(component.productsArray.at(0).value.nombre).toBe('Agua');
    expect(component.productsArray.at(0).value.categoriaId).toBe('cat-123');
  });

  it('dado que agrego una fila, debe sumar un elemento al array', () => {
    component.addProductRow();
    expect(component.productsArray.length).toBe(1);
  });

  it('dado que elimino una fila, debe restarse del array', () => {
    component.addProductRow();
    component.addProductRow();
    component.removeProductRow(0);
    expect(component.productsArray.length).toBe(1);
  });

  it('dado que hago click en guardar con form valido, debe emitir el listado', () => {
    spyOn(component.saveProducts, 'emit');
    component.addProductRow();
    component.productsArray.at(0).patchValue({ 
      nombre: 'Test', 
      precio: 100, 
      categoriaId: 'cat-123' 
    });
    component.onSave();
    expect(component.saveProducts.emit).toHaveBeenCalled();
  });

  it('dado que hago click en guardar con form invalido, NO debe emitir', () => {
    spyOn(component.saveProducts, 'emit');
    component.addProductRow();
    component.onSave();
    expect(component.saveProducts.emit).not.toHaveBeenCalled();
  });
});
