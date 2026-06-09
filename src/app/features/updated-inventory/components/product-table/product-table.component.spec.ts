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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deberia emitir quickAction con producto y accion', () => {
    spyOn(component.quickAction, 'emit');

    component.emitAction(mockProduct, 'ADD_STOCK');

    expect(component.quickAction.emit).toHaveBeenCalledWith({
      product: mockProduct,
      action: 'ADD_STOCK',
    });
  });

  it('deberia mostrar acciones de stock exacto', () => {
    const actions = component.getActions(mockProduct);

    expect(actions.map((action) => action.action)).toEqual([
      'ADD_STOCK',
      'SUBTRACT_STOCK',
      'SET_STOCK',
      'MARK_SOLD_OUT',
    ]);
  });
});
