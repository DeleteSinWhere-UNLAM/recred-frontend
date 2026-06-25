import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablaProductoComponent } from './tabla-producto.component';
import { ItemResumenInventario } from '../../models/inventario.interface';

describe('TablaProductoComponent', () => {
  let component: TablaProductoComponent;
  let fixture: ComponentFixture<TablaProductoComponent>;

  const mockProduct: ItemResumenInventario = {
    productId: '1',
    nombre: 'Producto 1',
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
      imports: [TablaProductoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
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
    const product: ItemResumenInventario = {
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
});
