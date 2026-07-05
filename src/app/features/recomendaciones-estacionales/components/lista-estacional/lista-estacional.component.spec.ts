import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciaMother } from '../../recomendaciones-estacionales.mother';
import { ListaEstacionalComponent } from './lista-estacional.component';

describe('ListaEstacionalComponent', () => {
  let component: ListaEstacionalComponent;
  let fixture: ComponentFixture<ListaEstacionalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEstacionalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaEstacionalComponent);
    component = fixture.componentInstance;
    component.sugerencias = [];
  });

  describe('render', () => {
    it('dado sin sugerencias, cuando renderizo, deberia mostrar el mensaje de estado vacio', () => {
      whenMonto();

      expect(textoRenderizado()).toContain('No hay sugerencias disponibles');
    });

    it('dado sugerencias, cuando renderizo, deberia mostrar el titulo "Sugerencias de stock" y una tarjeta por sugerencia', () => {
      component.sugerencias = [SugerenciaMother.crear(), SugerenciaMother.crearReducir()];

      whenMonto();

      const texto = textoRenderizado();
      expect(texto).toContain('Sugerencias de stock');
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('app-recommendation-card');
      expect(cards.length).toBe(2);
    });

    it('dado un tipPromocional, cuando renderizo, deberia mostrar el tip-card', () => {
      component.tipPromocional = 'Aprovechá el invierno';

      whenMonto();

      const tipCard = (fixture.nativeElement as HTMLElement).querySelector('app-tip-card');
      expect(tipCard).toBeTruthy();
    });

    it('dado sin tipPromocional, no deberia renderizar el tip-card', () => {
      whenMonto();

      expect((fixture.nativeElement as HTMLElement).querySelector('app-tip-card')).toBeNull();
    });
  });

  describe('eventos', () => {
    it('dado el metodo onTipActionClick, cuando lo llamo, deberia emitir tipActionClick', () => {
      spyOn(component.tipActionClick, 'emit');

      component.onTipActionClick();

      expect(component.tipActionClick.emit).toHaveBeenCalled();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
