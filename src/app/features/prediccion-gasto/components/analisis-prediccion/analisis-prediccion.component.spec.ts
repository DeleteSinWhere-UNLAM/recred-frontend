import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      component.categoriasMasConsumidas = [
        CategoriaMasConsumidaMother.crear({ descripcion: 'Bebidas', montoTotal: 1500 }),
        CategoriaMasConsumidaMother.crear({ descripcion: 'Snacks', montoTotal: 800 }),
      ];
      component.analisisIa = AnalisisIaMother.crear();
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Bebidas');
      expect(texto).toContain('1,500.00');
      expect(texto).toContain('Snacks');
      expect(texto).toContain('800.00');
    });

    it('dado sin categorias, deberia mostrar el mensaje de "No hay suficientes datos"', () => {
      component.categoriasMasConsumidas = [];
      component.analisisIa = AnalisisIaMother.crear();
      fixture.detectChanges();

      expect(textoRenderizado()).toContain('No hay suficientes datos de categorías');
    });
  });

  describe('analisis IA', () => {
    it('dado analisisIa, cuando renderizo, deberia mostrar el resumen y el modelo', () => {
      component.analisisIa = AnalisisIaMother.crear({
        resumen: 'Estas dentro del presupuesto.',
        modelo: 'gpt-4o-mini',
      });
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Estas dentro del presupuesto');
      expect(texto).toContain('gpt-4o-mini');
    });

    it('dado alertas, deberia renderizar el bloque "Alertas" con cada item', () => {
      component.analisisIa = AnalisisIaMother.crearConAlertas();
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Alertas');
      expect(texto).toContain('Categoria Golosinas supera el 60%');
    });

    it('dado sin alertas, no deberia renderizar el bloque de Alertas', () => {
      component.analisisIa = AnalisisIaMother.crearVacio();
      fixture.detectChanges();

      expect(queryUno('.prediction-analysis__lista--alerta')).toBeNull();
    });

    it('dado recomendaciones, deberia renderizar el bloque "Recomendaciones" con cada item', () => {
      component.analisisIa = AnalisisIaMother.crear({
        recomendaciones: ['Reducir bebidas azucaradas', 'Aumentar frutas'],
      });
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Recomendaciones');
      expect(texto).toContain('Reducir bebidas azucaradas');
      expect(texto).toContain('Aumentar frutas');
    });

    it('dado analisisIa null, deberia mostrar el mensaje de "No hay un análisis disponible"', () => {
      component.analisisIa = null;
      fixture.detectChanges();

      expect(textoRenderizado()).toContain('No hay un análisis disponible');
    });
  });

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
