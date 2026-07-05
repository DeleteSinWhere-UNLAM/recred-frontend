import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemCarritoMother, ProductoMother } from '../../compra.mother';
import { CarritoService } from '../../services/carrito.service';
import { CarritoItemComponent } from './carrito-item.component';

describe('CarritoItemComponent', () => {
  let component: CarritoItemComponent;
  let fixture: ComponentFixture<CarritoItemComponent>;
  let carritoService: jasmine.SpyObj<CarritoService>;

  beforeEach(async () => {
    carritoService = jasmine.createSpyObj<CarritoService>('CarritoService', ['puedeAgregar']);
    carritoService.puedeAgregar.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [CarritoItemComponent],
      providers: [{ provide: CarritoService, useValue: carritoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CarritoItemComponent);
    component = fixture.componentInstance;
    component.item = ItemCarritoMother.crear({ cantidad: 2 });
  });

  describe('render', () => {
    it('dado un item, cuando renderizo, deberia mostrar nombre, precio unitario y subtotal formateados', () => {
      whenMonto();

      const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(html).toContain('Alfajor');
      expect(html).toMatch(/\$\s?500/);
      expect(html).toMatch(/\$\s?1\.000/);
      expect(html).toContain('2');
    });

    it('dado que el service dice que no se puede agregar mas, cuando renderizo, deberia deshabilitar el boton +', () => {
      carritoService.puedeAgregar.and.returnValue(false);
      component.item = ItemCarritoMother.crear();

      whenMonto();

      const btnMas = botones()[1];
      expect(btnMas.disabled).toBeTrue();
    });
  });

  describe('eventos', () => {
    it('cuando hago click en el boton menos, deberia emitir restar con el id del item', () => {
      spyOn(component.restar, 'emit');
      whenMonto();

      botones()[0].click();

      expect(component.restar.emit).toHaveBeenCalledWith('item-1');
    });

    it('cuando hago click en el boton mas, deberia emitir sumar con el id del item', () => {
      spyOn(component.sumar, 'emit');
      whenMonto();

      botones()[1].click();

      expect(component.sumar.emit).toHaveBeenCalledWith('item-1');
    });

    it('cuando hago click en el boton eliminar, deberia emitir eliminar con el id del item', () => {
      spyOn(component.eliminar, 'emit');
      whenMonto();

      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.carrito-item__eliminar')?.click();

      expect(component.eliminar.emit).toHaveBeenCalledWith('item-1');
    });
  });

  describe('onImagenError', () => {
    it('dado un error en la imagen, cuando lo capturo, deberia reemplazar el src por el fallback', () => {
      component.item = ItemCarritoMother.crear({ producto: ProductoMother.crear({ imagen: 'ruta-inexistente.jpg' }) });
      whenMonto();
      const img = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('img.carrito-item__imagen')!;

      component['onImagenError']({ target: img } as unknown as Event);

      expect(img.src).toContain('cloudinary.com');
    });

    it('dado un error en la imagen que ya es el fallback, cuando lo capturo, no deberia volver a setearla', () => {
      const fallback = 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
      const img = document.createElement('img');
      img.src = fallback;
      const setterSpy = spyOnProperty(img, 'src', 'set');

      component['onImagenError']({ target: img } as unknown as Event);

      expect(setterSpy).not.toHaveBeenCalled();
    });
  });

  describe('computeds sin item', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CarritoItemComponent],
        providers: [{ provide: CarritoService, useValue: carritoService }],
      }).compileComponents();
      fixture = TestBed.createComponent(CarritoItemComponent);
      component = fixture.componentInstance;
    });

    it('sin item seteado, deshabilitarSumar deberia ser true y los formateados deberian ser ""', () => {
      expect(component.deshabilitarSumar()).toBeTrue();
      expect(component.precioFormateado()).toBe('');
      expect(component.subtotalFormateado()).toBe('');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function botones(): HTMLButtonElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.carrito-item__qty-btn'),
    );
  }
});
