import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductTableComponent } from './product-table.component';
import { InventoryOverviewItem } from '../../models/inventory.interface';

describe('ProductTableComponent', () => {
  let component: ProductTableComponent;
  let fixture: ComponentFixture<ProductTableComponent>;

  const mockProduct: InventoryOverviewItem = {
    productId: '1',
    nombre: 'Product 1',
    precio: 100,
    tipoManejoInventario: 'STOCK_EXACTO',
    estadoInventario: 'DISPONIBLE',
    stockActual: 10,
    stockReservado: 2,
    stockDisponible: 8,
    stockMinimo: 3,
    cupoMaximoDiario: null,
    cupoDisponibleDia: null,
    disponible: true,
    bajoStock: false,
    agotado: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('deberia emitir manageInventory con producto', () => {
    spyOn(component.manageInventory, 'emit');

    component.emitManageInventory(mockProduct);

    expect(component.manageInventory.emit).toHaveBeenCalledWith(mockProduct);
  });

  it('deberia emitir viewHistory con producto', () => {
    spyOn(component.viewHistory, 'emit');

    component.emitViewHistory(mockProduct);

    expect(component.viewHistory.emit).toHaveBeenCalledWith(mockProduct);
  });

  it('deberia mostrar el modo disponible/no disponible', () => {
    expect(component.getModeLabel('DISPONIBLE_NO_DISPONIBLE')).toBe(
      'Disponible / No disponible',
    );
  });

  it('deberia permitir activar un producto disponible/no disponible apagado aunque llegue como sin stock', () => {
    const product: InventoryOverviewItem = {
      ...mockProduct,
      tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
      estadoInventario: 'SIN_STOCK',
      disponible: false,
      agotado: true,
      stockActual: null,
      stockDisponible: null,
      stockReservado: null,
    };

    expect(component.getStatusLabel(product)).toBe('No disponible');
    expect(component.getStockValue(product)).toBe('No disponible');
    expect(component.getAvailabilityLabel(product)).toBe('Estado operativo');
  });

  it('dado que el stock es cupo diario, deberia devolver formato cupo disponible', () => {
    const product: InventoryOverviewItem = {
      ...mockProduct,
      tipoManejoInventario: 'CUPO_DIARIO',
      cupoDisponibleDia: 5
    };
    expect(component.getStockValue(product)).toBe('5');
  });

  it('dado que el stock disponible es nulo, formatNullable deberia devolver guion', () => {
    expect(component.formatNullable(null)).toBe('-');
  });

  it('dado que pregunto si esta highlighted, deberia devolver segun el set', () => {
    component.highlightedProductIds = new Set(['1']);
    expect(component.isHighlighted(mockProduct)).toBeTrue();
    expect(component.isHighlighted({...mockProduct, productId: '2'})).toBeFalse();
  });

  it('dado que llamo a getAvailabilityPercent y getReservationPercent, deberia devolver calculos validos', () => {
    expect(component.getAvailabilityPercent(mockProduct)).toBeGreaterThanOrEqual(0);
    expect(component.getReservationPercent(mockProduct)).toBeGreaterThanOrEqual(0);
  });

  it('dado que llamo a getAvailabilityBase, deberia sumar disponible y reservado o guion', () => {
    expect(component.getAvailabilityBase(mockProduct)).toBe('10'); // 8 + 2
    expect(component.getAvailabilityBase({...mockProduct, stockDisponible: null, stockReservado: null})).toBe('-');
  });

  it('dado que llamo a emitEditProduct, deberia emitir editProduct', () => {
    spyOn(component.editProduct, 'emit');
    component.emitEditProduct(mockProduct);
    expect(component.editProduct.emit).toHaveBeenCalledWith(mockProduct);
  });

  it('dado que llamo a emitDeleteProduct, deberia emitir deleteProduct', () => {
    spyOn(component.deleteProduct, 'emit');
    component.emitDeleteProduct(mockProduct);
    expect(component.deleteProduct.emit).toHaveBeenCalledWith(mockProduct);
  });

  it('dado que hay error de imagen, deberia cambiar la imagen al fallback', () => {
    const imgElement = document.createElement('img');
    imgElement.src = 'bad-url.jpg';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component.onImagenError({ target: imgElement } as any);
    expect(imgElement.src).toContain('data:image/svg+xml');
  });

  it('dado que la imagen falla al cargar repetidas veces, deberia usar la imagen por defecto solo una vez', () => {
    const imgElement = document.createElement('img');
    imgElement.src = 'invalid-url';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component.onImagenError({ target: imgElement } as any);
    expect(imgElement.src).toContain('data:image/svg+xml');
    
    // Segunda vez no deberia volver a procesar si ya es fallback
    const fallbackSrc = imgElement.src;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component.onImagenError({ target: imgElement } as any);
    expect(imgElement.src).toBe(fallbackSrc);
  });

  it('dado que consulto icono de estado, deberia mapear correctamente', () => {
    expect(component.getStatusIcon(mockProduct)).toBe('fa-check'); // DISPONIBLE
    expect(component.getStatusIcon({...mockProduct, agotado: true, estadoInventario: 'SIN_STOCK'})).toBe('fa-ban');
  });

  it('dado que llamo a isHighReservation, deberia llamar a la funcion del modelo', () => {
    expect(component.isHighReservation(mockProduct)).toBeFalse();
  });
});
