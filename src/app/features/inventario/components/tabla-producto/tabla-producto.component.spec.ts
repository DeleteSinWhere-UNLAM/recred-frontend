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
    it('dado STOCK_EXACTO, cuando pido el label, deberia devolver "Control por unidades"', () => {
      expect(component.getModeLabel('STOCK_EXACTO')).toBe('Control por unidades');
    });

    it('dado DISPONIBLE_NO_DISPONIBLE, cuando pido el label, deberia devolver "Disponible / No disponible"', () => {
      expect(component.getModeLabel('DISPONIBLE_NO_DISPONIBLE')).toBe('Disponible / No disponible');
    });

    it('dado CUPO_DIARIO, cuando pido el label, deberia devolver "Límite diario de venta"', () => {
      expect(component.getModeLabel('CUPO_DIARIO')).toBe('Límite diario de venta');
    });
  });

  describe('getStatusLabel y getStockValue', () => {
    it('dado un producto DISPONIBLE_NO_DISPONIBLE apagado y SIN_STOCK, cuando pido labels, deberia mostrar "No disponible"', () => {
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

    it('dado un producto SIN_STOCK con stock exacto, cuando pido el label, deberia mostrar "Agotado"', () => {
      const producto = ItemResumenInventarioMother.crearAgotado();

      expect(component.getStatusLabel(producto)).toBe('Agotado');
    });

    it('dado un producto BAJO_STOCK, cuando pido el label, deberia mostrar "Bajo stock"', () => {
      const producto = ItemResumenInventarioMother.crearBajoStock();

      expect(component.getStatusLabel(producto)).toBe('Bajo stock');
    });

    it('dado CUPO_DIARIO con cupoDisponibleDia 8, cuando pido los labels, deberia separar cupo diario de stock fisico', () => {
      const producto = ItemResumenInventarioMother.crear({
        tipoManejoInventario: 'CUPO_DIARIO',
        cupoMaximoDiario: 20,
        cupoDisponibleDia: 8,
        stockActual: 14,
        stockReservado: 12,
        stockMinimo: 4,
      });

      expect(component.getStockValue(producto)).toBe('8');
      expect(component.getAvailabilityLabel(producto)).toBe('Disponible hoy');
      expect(component.getAvailabilityPercent(producto)).toBe(40);
      expect(component.getAvailabilitySecondaryStartLabel(producto)).toBe('Usado hoy');
      expect(component.getAvailabilitySecondaryStartValue(producto)).toBe('12');
      expect(component.getAvailabilitySecondaryEndLabel(producto)).toBe('Límite');
      expect(component.getAvailabilitySecondaryEndValue(producto)).toBe('20');
      expect(component.getPrimaryStockMetricLabel(producto)).toBe('Stock físico');
      expect(component.getSecondaryStockMetricLabel(producto)).toBe('Reservado');
      expect(component.getSecondaryStockMetricValue(producto)).toBe('12');
      expect(component.getTertiaryStockMetricLabel(producto)).toBe('Alerta en');
      expect(component.getTertiaryStockMetricValue(producto)).toBe('4');
    });

    it('dado stockDisponible null en STOCK_EXACTO, cuando pido el stockValue, deberia mostrar "-"', () => {
      const producto = ItemResumenInventarioMother.crear({ stockDisponible: null });

      expect(component.getStockValue(producto)).toBe('-');
    });

    it('dado STOCK_EXACTO, cuando pido labels secundarios, deberia mantener la lectura de stock fisico', () => {
      const producto = ItemResumenInventarioMother.crear({
        stockActual: 14,
        stockDisponible: 2,
        stockReservado: 12,
        stockMinimo: 4,
      });

      expect(component.getAvailabilityLabel(producto)).toBe('Disponible');
      expect(component.getAvailabilitySecondaryStartLabel(producto)).toBe('Reservado');
      expect(component.getAvailabilitySecondaryStartValue(producto)).toBe('12');
      expect(component.getAvailabilitySecondaryEndLabel(producto)).toBe('Total');
      expect(component.getAvailabilitySecondaryEndValue(producto)).toBe('14');
      expect(component.getPrimaryStockMetricLabel(producto)).toBe('Stock actual');
      expect(component.getSecondaryStockMetricLabel(producto)).toBe('Alerta en');
      expect(component.getSecondaryStockMetricValue(producto)).toBe('4');
      expect(component.getTertiaryStockMetricLabel(producto)).toBe('Reserva');
      expect(component.getTertiaryStockMetricValue(producto)).toBe('86%');
    });
  });

  describe('highlight', () => {
    it('dado un set de ids marcados que contiene el del producto, cuando consulto isHighlighted, deberia ser true', () => {
      givenIdsMarcados(['producto-1']);

      expect(component.isHighlighted(ItemResumenInventarioMother.crear())).toBeTrue();
    });

    it('dado un producto no marcado, cuando consulto isHighlighted, deberia ser false', () => {
      givenIdsMarcados(['otro']);

      expect(component.isHighlighted(ItemResumenInventarioMother.crear())).toBeFalse();
    });
  });

  describe('onImagenError', () => {
    it('dado un src distinto al fallback, cuando se dispara error, deberia reemplazarlo por IMAGEN_FALLBACK', () => {
      const img = document.createElement('img');
      img.src = 'ruta-mala.png';

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toContain('logo_sin_fondo');
    });

    it('dado un src que ya es el fallback, cuando se dispara error, no deberia volver a asignarlo (evita loop)', () => {
      const img = document.createElement('img');
      img.src = 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
      const previo = img.src;

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toBe(previo);
    });
  });

  function givenIdsMarcados(ids: string[]): void {
    component.highlightedProductIds = new Set(ids);
  }
});
