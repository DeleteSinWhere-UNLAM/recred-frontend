import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciaCarritoMother } from '../../compra.mother';
import { SugerenciasCarritoComponent } from './sugerencias-carrito.component';

describe('SugerenciasCarritoComponent', () => {
  let component: SugerenciasCarritoComponent;
  let fixture: ComponentFixture<SugerenciasCarritoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciasCarritoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciasCarritoComponent);
    component = fixture.componentInstance;
  });

  describe('estados', () => {
    it('dado cargando=true, cuando renderizo, deberia mostrar el texto "Buscando sugerencias..."', () => {
      component.sugerencias = [];
      component.cargando = true;

      whenMonto();

      expect(textoRenderizado()).toContain('Buscando sugerencias...');
    });

    it('dado sin sugerencias y no cargando, cuando renderizo, deberia mostrar el empty state', () => {
      component.sugerencias = [];
      component.cargando = false;

      whenMonto();

      expect(textoRenderizado()).toContain('Sin sugerencias por ahora');
    });

    it('dadas sugerencias, cuando renderizo, deberia crear un item por sugerencia', () => {
      component.sugerencias = [
        SugerenciaCarritoMother.crear({ productId: 's-1', productName: 'Agua', price: 300 }),
        SugerenciaCarritoMother.crear({ productId: 's-2', productName: 'Yogur', price: 500 }),
      ];

      whenMonto();

      const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.sugerencias-carrito__item');
      expect(items.length).toBe(2);
      expect(textoRenderizado()).toContain('Agua');
      expect(textoRenderizado()).toMatch(/\$\s?300/);
    });
  });

  describe('etiqueta por source', () => {
    it('dado source FAVORITE, deberia mostrar la etiqueta "Favorito"', () => {
      component.sugerencias = [SugerenciaCarritoMother.crear({ source: 'FAVORITE' })];

      whenMonto();

      expect(textoRenderizado()).toContain('Favorito');
    });

    it('dado source DAY_PATTERN, deberia mostrar "Te puede gustar hoy"', () => {
      component.sugerencias = [SugerenciaCarritoMother.crear({ source: 'DAY_PATTERN' })];

      whenMonto();

      expect(textoRenderizado()).toContain('Te puede gustar hoy');
    });

    it('dado source BUFFET_CART_AFFINITY, deberia mostrar "Combo frecuente"', () => {
      component.sugerencias = [SugerenciaCarritoMother.crear({ source: 'BUFFET_CART_AFFINITY' })];

      whenMonto();

      expect(textoRenderizado()).toContain('Combo frecuente');
    });
  });

  describe('onAgregar', () => {
    it('cuando hago click en agregar en un item, deberia emitir agregar con la sugerencia', () => {
      const sugerencia = SugerenciaCarritoMother.crear();
      component.sugerencias = [sugerencia];
      spyOn(component.agregar, 'emit');
      whenMonto();

      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('.sugerencias-carrito__cta')
        ?.click();

      expect(component.agregar.emit).toHaveBeenCalledWith(sugerencia);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
