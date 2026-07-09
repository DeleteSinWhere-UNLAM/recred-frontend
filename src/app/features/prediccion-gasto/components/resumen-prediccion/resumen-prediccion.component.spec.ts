import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrediccionGastoMother } from '../../prediccion-gasto.mother';
import { ResumenPrediccionComponent } from './resumen-prediccion.component';

describe('ResumenPrediccionComponent', () => {
  let component: ResumenPrediccionComponent;
  let fixture: ComponentFixture<ResumenPrediccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenPrediccionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenPrediccionComponent);
    component = fixture.componentInstance;
  });

  describe('render con datos completos', () => {
    it('dado una prediccion default, cuando renderizo, deberia mostrar el titulo con el periodo y los montos', () => {
      whenRenderoCon(PrediccionGastoMother.crear());

      const texto = textoRenderizado();
      expect(texto).toContain('SEMANAL');
      expect(texto).toContain('3,000.00');
      expect(texto).toContain('4,500.00');
      expect(texto).toContain('500.00');
    });

    it('dado datos, deberia mostrar los stats de dias analizados y dias restantes', () => {
      whenRenderoCon(PrediccionGastoMother.crear({ diasHistoricosUsados: 20, diasRestantes: 3 }));

      const texto = textoRenderizado();
      expect(texto).toContain('20');
      expect(texto).toContain('3');
    });
  });

  describe('barra de limite', () => {
    it('dado montoLimite null, deberia mostrar el mensaje de "No hay un límite"', () => {
      whenRenderoCon(PrediccionGastoMother.crearSinLimite());

      expect(textoRenderizado()).toContain('No hay un límite de presupuesto definido');
      expect(queryUno('.prediction-summary__limite')).toBeNull();
    });

    it('dado porcentajePresupuesto = 0.5, la barra no deberia tener la clase danger', () => {
      whenRenderoCon(PrediccionGastoMother.crear({ porcentajePresupuesto: 0.5 }));

      const barra = queryUno('.prediction-summary__limite');
      expect(barra).toBeTruthy();
      expect(barra!.classList.contains('prediction-summary__limite--danger')).toBeFalse();
    });

    it('dado porcentajePresupuesto > 0.8, la barra deberia tener la clase danger', () => {
      whenRenderoCon(PrediccionGastoMother.crearCercaDelLimite());

      const barra = queryUno('.prediction-summary__limite');
      expect(barra).toBeTruthy();
      expect(barra!.classList.contains('prediction-summary__limite--danger')).toBeTrue();
    });

    it('dado porcentajePresupuesto > 1.0, el ancho de la barra debe cortarse en 100%', () => {
      whenRenderoCon(PrediccionGastoMother.crear({ porcentajePresupuesto: 1.5 }));

      const fill = queryUno('.prediction-summary__barra-fill') as HTMLElement | null;
      expect(fill).toBeTruthy();
      expect(fill!.style.width).toBe('100%');
    });
  });

  describe('porcentajeActualPorc', () => {
    it('dado porcentajePresupuesto null, deberia devolver 0', () => {
      component.porcentajePresupuesto = null;

      expect(component.porcentajeActualPorc).toBe(0);
    });

    it('dado porcentajePresupuesto 0.5, deberia devolver 50', () => {
      component.porcentajePresupuesto = 0.5;

      expect(component.porcentajeActualPorc).toBe(50);
    });

    it('dado porcentajePresupuesto > 1, deberia caparlo a 100', () => {
      component.porcentajePresupuesto = 1.5;

      expect(component.porcentajeActualPorc).toBe(100);
    });
  });

  describe('porcentajePredichoPorc', () => {
    it('dado montoLimite null, deberia devolver 0', () => {
      component.montoLimite = null;
      component.gastoPredicho = 1000;

      expect(component.porcentajePredichoPorc).toBe(0);
    });

    it('dado montoLimite 0, deberia devolver 0', () => {
      component.montoLimite = 0;
      component.gastoPredicho = 1000;

      expect(component.porcentajePredichoPorc).toBe(0);
    });

    it('dado montoLimite negativo, deberia devolver 0', () => {
      component.montoLimite = -50;
      component.gastoPredicho = 1000;

      expect(component.porcentajePredichoPorc).toBe(0);
    });

    it('dado montoLimite valido y gastoPredicho al 50%, deberia devolver 50', () => {
      component.montoLimite = 2000;
      component.gastoPredicho = 1000;

      expect(component.porcentajePredichoPorc).toBe(50);
    });

    it('dado gastoPredicho > montoLimite, deberia caparlo a 100', () => {
      component.montoLimite = 1000;
      component.gastoPredicho = 3000;

      expect(component.porcentajePredichoPorc).toBe(100);
    });
  });

  function whenRenderoCon(
    prediccion: ReturnType<typeof PrediccionGastoMother.crear>,
  ): void {
    component.periodo = prediccion.periodo;
    component.fechaCalculo = prediccion.fechaCalculo;
    component.fechaInicio = prediccion.fechaInicio;
    component.fechaFin = prediccion.fechaFin;
    component.gastoActual = prediccion.gastoActual;
    component.gastoPredicho = prediccion.gastoPredicho;
    component.promedioGastoDiario = prediccion.promedioGastoDiario;
    component.montoLimite = prediccion.montoLimite;
    component.porcentajePresupuesto = prediccion.porcentajePresupuesto;
    component.diasHistoricosUsados = prediccion.diasHistoricosUsados;
    component.diasRestantes = prediccion.diasRestantes;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
