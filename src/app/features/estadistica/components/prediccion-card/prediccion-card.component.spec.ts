import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrediccionGastoMother } from '../../estadistica.mother';
import { NivelAlerta, PrediccionGasto } from '../../../presupuesto/models/presupuesto.model';
import { PrediccionCardComponent } from './prediccion-card.component';

describe('PrediccionCardComponent', () => {
  let component: PrediccionCardComponent;
  let fixture: ComponentFixture<PrediccionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrediccionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrediccionCardComponent);
    component = fixture.componentInstance;
  });

  describe('Estado sin prediccion', () => {
    it('dado prediccion undefined, deberia renderizar el estado vacio', () => {
      whenRenderoCon(undefined, 'ok');

      const texto = textoRenderizado();
      expect(texto).toContain('Todavía no hay datos suficientes');
      expect(queryUno('.prediccion-card--vacio')).toBeTruthy();
      expect(queryUno('.prediccion-card__donut')).toBeNull();
    });
  });

  describe('Estado con prediccion', () => {
    it('dado una prediccion, deberia renderizar el titulo, gasto actual y proyectado', () => {
      whenRenderoCon(
        PrediccionGastoMother.crear({
          gastoActual: 3000,
          gastoPredicho: 4500,
        }),
        'ok',
      );

      const texto = textoRenderizado();
      expect(texto).toContain('Gasto proyectado del período');
      expect(texto).toContain('3.000');
      expect(texto).toContain('4.500');
    });

    it('dado una prediccion con categorias, deberia renderizar el top de categorias', () => {
      whenRenderoCon(PrediccionGastoMother.crear(), 'ok');

      const texto = textoRenderizado();
      expect(texto).toContain('Top categorías');
      expect(texto).toContain('Bebidas');
      expect(texto).toContain('Snacks');
    });

    it('dado una prediccion sin categorias, no deberia renderizar el bloque Top categorias', () => {
      whenRenderoCon(PrediccionGastoMother.crearSinCategorias(), 'ok');

      expect(textoRenderizado()).not.toContain('Top categorías');
    });

    it('dado una prediccion con alertas, deberia renderizar cada alerta', () => {
      whenRenderoCon(PrediccionGastoMother.crearExcedido(), 'excedido');

      const texto = textoRenderizado();
      expect(texto).toContain('Excede el presupuesto');
      expect(texto).toContain('Revisar categorias');
    });

    it('dado una prediccion con recomendaciones, deberia renderizarlas', () => {
      whenRenderoCon(PrediccionGastoMother.crear(), 'ok');

      expect(textoRenderizado()).toContain('Mantener el ritmo actual');
    });
  });

  describe('porcentajeRedondeado y dashArray', () => {
    it('dado porcentaje 50.4, deberia redondearlo a 50 y mostrarlo con "%"', () => {
      whenRenderoCon(PrediccionGastoMother.crear({ porcentajePresupuesto: 50.4 }), 'ok');

      expect(component.porcentajeRedondeado()).toBe(50);
      expect(textoRenderizado()).toContain('50%');
    });

    it('dado porcentaje 150, deberia clamperlo a 100 en el dashArray para no exceder la circunferencia', () => {
      whenRenderoCon(PrediccionGastoMother.crear({ porcentajePresupuesto: 150 }), 'excedido');

      const [lleno] = component.dashArray().split(' ').map(Number);
      expect(lleno).toBeCloseTo(component.circumferencia, 3);
    });

    it('dado prediccion undefined, porcentajeRedondeado deberia caer al fallback 0', () => {
      whenRenderoCon(undefined, 'ok');

      expect(component.porcentajeRedondeado()).toBe(0);
    });
  });

  describe('nivelLabel', () => {
    it('dado nivel "ok", el label deberia ser "En curso"', () => {
      whenRenderoCon(PrediccionGastoMother.crear(), 'ok');
      expect(component.nivelLabel()).toBe('En curso');
    });

    it('dado nivel "warning", el label deberia ser "Cerca del limite"', () => {
      whenRenderoCon(PrediccionGastoMother.crearWarning(), 'warning');
      expect(component.nivelLabel()).toBe('Cerca del límite');
    });

    it('dado nivel "excedido", el label deberia ser "Excede el presupuesto"', () => {
      whenRenderoCon(PrediccionGastoMother.crearExcedido(), 'excedido');
      expect(component.nivelLabel()).toBe('Excede el presupuesto');
    });
  });

  describe('formatear', () => {
    it('dado un monto, deberia formatearlo con simbolo $ y separador de miles argentino', () => {
      const salida = component.formatear(1500);
      expect(salida).toMatch(/\$/);
      expect(salida).toContain('1');
      expect(salida).toContain('500');
    });

    it('dado undefined, deberia formatear como 0', () => {
      const salida = component.formatear(undefined);
      expect(salida).toContain('0');
    });
  });

  function whenRenderoCon(prediccion: PrediccionGasto | undefined, nivel: NivelAlerta): void {
    component.prediccion = prediccion;
    component.nivel = nivel;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
