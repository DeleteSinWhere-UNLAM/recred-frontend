import { FormControl } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalTablaCargaMasivaComponent } from './modal-tabla-carga-masiva.component';
import { RespuestaProductoMasivo } from '../../services/carga-masiva.service';
import { ToastService } from '../../../../shared/services/toast.service';

describe('ModalTablaCargaMasivaComponent', () => {
  let component: ModalTablaCargaMasivaComponent;
  let fixture: ComponentFixture<ModalTablaCargaMasivaComponent>;
  let servicioToast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [ModalTablaCargaMasivaComponent],
      providers: [{ provide: ToastService, useValue: servicioToast }],
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

  it('dado que hago click en guardar sin filas, deberia mostrar toast "No hay productos para guardar"', () => {
    spyOn(component.saveProducts, 'emit');

    component.onSave();

    expect(component.saveProducts.emit).not.toHaveBeenCalled();
    expect(servicioToast.mostrar).toHaveBeenCalledWith('No hay productos para guardar', 'error');
  });

  it('dado que hago click en guardar con filas sin categoria, deberia mostrar toast sobre las filas en rojo', () => {
    spyOn(component.saveProducts, 'emit');
    component.addProductRow();
    component.productsArray.at(0).patchValue({ nombre: 'Test', precio: 100 });

    component.onSave();

    expect(component.saveProducts.emit).not.toHaveBeenCalled();
    expect(servicioToast.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/productos sin categor/i),
      'error',
    );
  });

  it('dado que guardo con form valido, el payload emitido NO deberia incluir unidadMedida', () => {
    let emitido: RespuestaProductoMasivo[] | undefined;
    component.saveProducts.subscribe((v) => (emitido = v));
    component.addProductRow();
    component.productsArray.at(0).patchValue({
      nombre: 'Test',
      precio: 100,
      categoriaId: 'cat-123',
    });

    component.onSave();

    expect(emitido?.length).toBe(1);
    expect(Object.keys(emitido?.[0] ?? {})).not.toContain('unidadMedida');
  });

  it('dado un evento de file input con archivo, deberia emitir fileSelected con el archivo', () => {
    spyOn(component.fileSelected, 'emit');
    const archivo = new File(['contenido'], 'productos.csv', { type: 'text/csv' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [archivo], configurable: true });

    component.onFileChange({ target: input } as unknown as Event);

    expect(component.fileSelected.emit).toHaveBeenCalledWith(archivo);
  });

  it('dado un evento de file input sin archivos, no deberia emitir', () => {
    spyOn(component.fileSelected, 'emit');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [], configurable: true });

    component.onFileChange({ target: input } as unknown as Event);

    expect(component.fileSelected.emit).not.toHaveBeenCalled();
  });

  it('dado que llamo onCancel, deberia emitir closeModal', () => {
    spyOn(component.closeModal, 'emit');

    component.onCancel();

    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('dado asFormGroup y asFormControl, deberian devolver el mismo control casteado', () => {
    component.addProductRow();
    const row = component.productsArray.at(0);
    const control = row.get('nombre')!;

    expect(component.asFormGroup(row)).toBe(row as never);
    expect(component.asFormControl(control)).toBe(control as FormControl);
  });

  it('dado una categoria "Bebidas", obtenerUnidadesPorCategoria deberia devolver ["ml","l"]', () => {
    component.categories = [{ id: 'cat-bebida', descripcion: 'Bebidas frias', activo: true }];

    expect(component.obtenerUnidadesPorCategoria('cat-bebida')).toEqual(['ml', 'l']);
  });

  it('dado una categoria comun, obtenerUnidadesPorCategoria deberia devolver ["g","kg"]', () => {
    component.categories = [{ id: 'cat-comida', descripcion: 'Snacks', activo: true }];

    expect(component.obtenerUnidadesPorCategoria('cat-comida')).toEqual(['g', 'kg']);
  });

  it('dado una categoriaId inexistente, obtenerUnidadesPorCategoria deberia caer al default de solidos', () => {
    expect(component.obtenerUnidadesPorCategoria('cat-inexistente')).toEqual(['g', 'kg']);
  });

  it('dado que cambio categoriaId a "NEW", nuevaCategoriaNombre deberia requerirse', () => {
    component.addProductRow();
    const row = component.productsArray.at(0);

    row.get('categoriaId')?.setValue('NEW');

    expect(row.get('nuevaCategoriaNombre')?.hasValidator).toBeDefined();
    expect(row.get('nuevaCategoriaNombre')?.invalid).toBeTrue();
  });

  it('dado que cambio a una categoria comida y luego a bebida, la unidad deberia ajustarse a la nueva lista', () => {
    component.categories = [
      { id: 'cat-comida', descripcion: 'Snacks', activo: true },
      { id: 'cat-bebida', descripcion: 'Bebidas', activo: true },
    ];
    component.addProductRow();
    const row = component.productsArray.at(0);

    row.get('categoriaId')?.setValue('cat-comida');
    expect(row.get('unidadMedida')?.value).toBe('g');

    row.get('categoriaId')?.setValue('cat-bebida');

    expect(row.get('unidadMedida')?.value).toBe('ml');
  });
});
