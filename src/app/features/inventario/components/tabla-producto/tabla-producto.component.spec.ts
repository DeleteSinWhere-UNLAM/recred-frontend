import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemResumenInventarioMother } from '../../inventario.mother';
import { TablaProductoComponent } from './tabla-producto.component';

describe('TablaProductoComponent', () => {
  let component: TablaProductoComponent;
  let fixture: ComponentFixture<TablaProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaProductoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaProductoComponent);
    component = fixture.componentInstance;
  });

  describe('emision de eventos', () => {
    it('dado un producto, cuando emito manageInventory, deberia propagarlo al Output', () => {
      spyOn(component.manageInventory, 'emit');
      const producto = ItemResumenInventarioMother.crear();

      component.emitManageInventory(producto);

      expect(component.manageInventory.emit).toHaveBeenCalledWith(producto);
    });

    it('dado un producto, cuando emito viewHistory, deberia propagarlo al Output', () => {
      spyOn(component.viewHistory, 'emit');
      const producto = ItemResumenInventarioMother.crear();

      component.emitViewHistory(producto);

      expect(component.viewHistory.emit).toHaveBeenCalledWith(producto);
    });

    it('dado un producto, cuando emito editProduct, deberia propagarlo al Output', () => {
      spyOn(component.editProduct, 'emit');
      const producto = ItemResumenInventarioMother.crear();

      component.emitEditProduct(producto);

      expect(component.editProduct.emit).toHaveBeenCalledWith(producto);
    });

    it('dado un producto, cuando emito deleteProduct, deberia propagarlo al Output', () => {
      spyOn(component.deleteProduct, 'emit');
      const producto = ItemResumenInventarioMother.crear();

      component.emitDeleteProduct(producto);

      expect(component.deleteProduct.emit).toHaveBeenCalledWith(producto);
    });
  });

  describe('getModeLabel', () => {
    it('dado STOCK_EXACTO, deberia devolver "Stock exacto"', () => {
      expect(component.getModeLabel('STOCK_EXACTO')).toBe('Stock exacto');
    });

    it('dado DISPONIBLE_NO_DISPONIBLE, deberia devolver "Disponible / No disponible"', () => {
      expect(component.getModeLabel('DISPONIBLE_NO_DISPONIBLE')).toBe(
        'Disponible / No disponible',
      );
    });

    it('dado CUPO_DIARIO, deberia devolver "Cupo diario"', () => {
      expect(component.getModeLabel('CUPO_DIARIO')).toBe('Cupo diario');
    });
  });

  describe('getStatusLabel y getStockValue', () => {
    it('dado un producto DISPONIBLE_NO_DISPONIBLE apagado con estado SIN_STOCK, deberia mostrar "No disponible" en label y valor', () => {
      const producto = ItemResumenInventarioMother.crear({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        estadoInventario: 'SIN_STOCK',
        disponible: false,
        agotado: true,
        stockActual: null,
        stockDisponible: null,
        stockReservado: null,
      });

      expect(component.getStatusLabel(producto)).toBe('No disponible');
      expect(component.getStockValue(producto)).toBe('No disponible');
      expect(component.getAvailabilityLabel(producto)).toBe('Estado operativo');
    });

    it('dado un producto SIN_STOCK con stock exacto, deberia mostrar "Agotado" en label', () => {
      const producto = ItemResumenInventarioMother.crearAgotado();

      expect(component.getStatusLabel(producto)).toBe('Agotado');
    });

    it('dado un producto BAJO_STOCK, deberia mostrar "Bajo stock" en label', () => {
      const producto = ItemResumenInventarioMother.crearBajoStock();

      expect(component.getStatusLabel(producto)).toBe('Bajo stock');
    });

    it('dado CUPO_DIARIO, getStockValue deberia mostrar el cupoDisponibleDia', () => {
      const producto = ItemResumenInventarioMother.crear({
        tipoManejoInventario: 'CUPO_DIARIO',
        cupoMaximoDiario: 20,
        cupoDisponibleDia: 8,
      });

      expect(component.getStockValue(producto)).toBe('8');
    });

    it('dado stockDisponible null en STOCK_EXACTO, getStockValue deberia mostrar "-"', () => {
      const producto = ItemResumenInventarioMother.crear({ stockDisponible: null });

      expect(component.getStockValue(producto)).toBe('-');
    });
  });

  describe('highlight', () => {
    it('dado un producto y un set de ids marcados que contiene el suyo, isHighlighted deberia ser true', () => {
      component.highlightedProductIds = new Set(['producto-1']);

      expect(component.isHighlighted(ItemResumenInventarioMother.crear())).toBeTrue();
    });

    it('dado un producto no marcado, isHighlighted deberia ser false', () => {
      component.highlightedProductIds = new Set(['otro']);

      expect(component.isHighlighted(ItemResumenInventarioMother.crear())).toBeFalse();
    });
  });

  describe('onImagenError', () => {
    it('dado un src distinto al fallback, deberia reemplazarlo por IMAGEN_FALLBACK', () => {
      const img = document.createElement('img');
      img.src = 'ruta-mala.png';

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toContain('logo_sin_fondo');
    });

    it('dado un src que ya es el fallback, no deberia volver a asignarlo (evita loop)', () => {
      const img = document.createElement('img');
      img.src = 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
      const previo = img.src;

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toBe(previo);
    });
  });
});
