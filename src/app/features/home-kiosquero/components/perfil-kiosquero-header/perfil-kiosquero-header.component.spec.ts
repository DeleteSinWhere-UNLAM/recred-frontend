import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PerfilKiosqueroHeaderComponent } from './perfil-kiosquero-header.component';

describe('PerfilKiosqueroHeaderComponent', () => {
  let component: PerfilKiosqueroHeaderComponent;
  let fixture: ComponentFixture<PerfilKiosqueroHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilKiosqueroHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilKiosqueroHeaderComponent);
    component = fixture.componentInstance;
    component.iniciales = 'MK';
    component.nombreKiosquero = 'Marta Kiosquera';
    component.saludo = 'Buen día';
    component.gananciasFormateadas = '$ 45.000';
    component.ventasHoy = 12;
    component.productosSinStock = 3;
    component.pedidosPendientes = 5;
    fixture.detectChanges();
  });

  describe('render', () => {
    it('dado los datos del kiosquero, cuando se renderiza, deberia mostrar nombre e iniciales', () => {
      const texto = textoDelHeader();

      expect(texto).toContain('Marta Kiosquera');
      expect(texto).toContain('MK');
    });

    it('dado las stats, cuando se renderiza, deberia mostrar ganancias, ventas y sin stock', () => {
      const texto = textoDelHeader();

      expect(texto).toContain('$ 45.000');
      expect(texto).toContain('12');
      expect(texto).toContain('3');
    });

    it('dado pedidosPendientes, cuando se renderiza, deberia mostrar el numero', () => {
      expect(textoDelHeader()).toContain('5');
    });

    it('dado productosSinStock > 0, cuando se renderiza, deberia marcar la stat de sin stock como alerta', () => {
      const sinStock = statConTexto('Sin stock');

      expect(sinStock?.classList.contains('perfil-kiosquero-header__stat--alerta')).toBeTrue();
    });

    it('dado pedidosPendientes > 0, cuando se renderiza, deberia marcar el link como alerta', () => {
      const link = (fixture.nativeElement as HTMLElement).querySelector(
        '.perfil-kiosquero-header__stat--link',
      );

      expect(link?.classList.contains('perfil-kiosquero-header__stat--alerta')).toBeTrue();
    });

    it('dado productosSinStock 0, cuando se renderiza, no deberia marcar la stat de sin stock como alerta', () => {
      givenProductosSinStock(0);

      const sinStock = statConTexto('Sin stock');
      expect(sinStock?.classList.contains('perfil-kiosquero-header__stat--alerta')).toBeFalse();
    });
  });

  function givenProductosSinStock(cantidad: number): void {
    fixture.componentRef.setInput('productosSinStock', cantidad);
    fixture.detectChanges();
  }

  function textoDelHeader(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function statConTexto(fragmento: string): Element | undefined {
    const stats = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.perfil-kiosquero-header__stat',
    );
    return Array.from(stats).find((s) => s.textContent?.includes(fragmento));
  }
});
