import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sugerencia } from '../../models/recomendacion.model';
import { SugerenciaMother } from '../../recomendaciones-estacionales.mother';
import { TarjetaRecomendacionComponent } from './tarjeta-recomendacion.component';

describe('TarjetaRecomendacionComponent', () => {
  let component: TarjetaRecomendacionComponent;
  let fixture: ComponentFixture<TarjetaRecomendacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaRecomendacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaRecomendacionComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('dado una sugerencia AUMENTAR, cuando renderizo, deberia mostrar la categoria en el titulo y el badge "Aumentar"', () => {
      givenSugerencia(SugerenciaMother.crear({ categoria: 'Bebidas Calientes' }));

      expect(queryUno('.recommendation-card__titulo')?.textContent).toContain('Bebidas Calientes');
      expect(textoRenderizado()).toContain('Aumentar');
    });

    it('dado una sugerencia REDUCIR, cuando renderizo, deberia mostrar la categoria y el badge "Reducir"', () => {
      givenSugerencia(SugerenciaMother.crearReducir());

      expect(queryUno('.recommendation-card__titulo')?.textContent).toContain('Helados');
      expect(textoRenderizado()).toContain('Reducir');
    });
  });

  function givenSugerencia(sugerencia: Sugerencia): void {
    component.item = sugerencia;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
