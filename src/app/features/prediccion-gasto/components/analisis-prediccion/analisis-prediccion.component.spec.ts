import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalisisIa } from '../../models/analisis-ia.interface';
import {
  AnalisisIaMother,
  CategoriaMasConsumidaMother,
} from '../../prediccion-gasto.mother';
import { AnalisisPrediccionComponent } from './analisis-prediccion.component';

describe('AnalisisPrediccionComponent', () => {
  let component: AnalisisPrediccionComponent;
  let fixture: ComponentFixture<AnalisisPrediccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalisisPrediccionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalisisPrediccionComponent);
    component = fixture.componentInstance;
  });

  describe('categorias mas consumidas', () => {
    it('dado categorias, cuando renderizo, deberia mostrar la descripcion y el monto de cada una', () => {
      givenCategorias([
        CategoriaMasConsumidaMother.crear({ descripcion: 'Bebidas', montoTotal: 1500 }),
        CategoriaMasConsumidaMother.crear({ descripcion: 'Snacks', montoTotal: 800 }),
      ]);
      givenAnalisisIa(AnalisisIaMother.crear());
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Bebidas');
      expect(texto).toContain('1,500.00');
      expect(texto).toContain('Snacks');
      expect(texto).toContain('800.00');
    });

    it('dado sin categorias, cuando renderizo, deberia mostrar el mensaje de "No hay suficientes datos"', () => {
      givenCategorias([]);
      givenAnalisisIa(AnalisisIaMother.crear());
      fixture.detectChanges();

      expect(textoRenderizado()).toContain('No hay suficientes datos de categorías');
    });
  });

  describe('analisis IA', () => {
    it('dado analisisIa, cuando renderizo, deberia mostrar el resumen y el modelo', () => {
      givenAnalisisIa(AnalisisIaMother.crear({
        resumen: 'Estas dentro del presupuesto.',
        modelo: 'gpt-4o-mini',
      }));
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Estas dentro del presupuesto');
      expect(texto).toContain('gpt-4o-mini');
    });

    it('dado alertas en el analisis, cuando renderizo, deberia renderizar el bloque "Alertas" con cada item', () => {
      givenAnalisisIa(AnalisisIaMother.crearConAlertas());
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Alertas');
      expect(texto).toContain('Categoria Golosinas supera el 60%');
    });

    it('dado sin alertas, cuando renderizo, no deberia mostrar el bloque de Alertas', () => {
      givenAnalisisIa(AnalisisIaMother.crearVacio());
      fixture.detectChanges();

      expect(queryUno('.prediction-analysis__lista--alerta')).toBeNull();
    });

    it('dado recomendaciones, cuando renderizo, deberia mostrar el bloque "Recomendaciones" con cada item', () => {
      givenAnalisisIa(AnalisisIaMother.crear({
        recomendaciones: ['Reducir bebidas azucaradas', 'Aumentar frutas'],
      }));
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Recomendaciones');
      expect(texto).toContain('Reducir bebidas azucaradas');
      expect(texto).toContain('Aumentar frutas');
    });

    it('dado analisisIa null, cuando renderizo, deberia mostrar el mensaje de "No hay un análisis disponible"', () => {
      givenAnalisisIa(null);
      fixture.detectChanges();

      expect(textoRenderizado()).toContain('No hay un análisis disponible');
    });
  });

  function givenCategorias(categorias: ReturnType<typeof CategoriaMasConsumidaMother.crear>[]): void {
    component.categoriasMasConsumidas = categorias;
  }

  function givenAnalisisIa(analisis: AnalisisIa | null): void {
    component.analisisIa = analisis;
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
