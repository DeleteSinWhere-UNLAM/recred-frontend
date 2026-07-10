import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { Movimiento } from '../../../movimientos/models/movimiento.model';
import { MovimientoMother } from '../../../movimientos/movimientos.mother';
import { TendenciaCardComponent } from './tendencia-card.component';

describe('TendenciaCardComponent', () => {
  let component: TendenciaCardComponent;
  let fixture: ComponentFixture<TendenciaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TendenciaCardComponent],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(TendenciaCardComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('siempre deberia mostrar el titulo "Tendencia de Gastos"', () => {
      givenHistorial([]);

      expect(textoRenderizado()).toContain('Tendencia de Gastos');
    });

    it('dado historial vacio, deberia mostrar el mensaje de estado vacio y no renderizar el canvas', () => {
      givenHistorial([]);

      expect(textoRenderizado()).toContain('No hay suficientes datos de compras');
      expect(queryUno('canvas')).toBeNull();
    });

    it('dado historial con movimientos validos, deberia renderizar el canvas y ocultar el mensaje vacio', () => {
      givenHistorial([
        MovimientoMother.crear({
          status: 'ENTREGADO',
          date: '2026-06-05T10:00:00Z',
          totalAmount: 1000,
        }),
      ]);

      expect(queryUno('canvas')).toBeTruthy();
      expect(textoRenderizado()).not.toContain('No hay suficientes datos de compras');
    });

    it('dado un historial con movimientos filtrados en su totalidad, deberia mostrar el mensaje vacio', () => {
      givenHistorial([
        MovimientoMother.crear({ status: 'PENDIENTE', date: '2026-06-05T10:00:00Z' }),
        MovimientoMother.crear({ status: 'CANCELADO', date: '2026-06-06T10:00:00Z' }),
      ]);

      expect(textoRenderizado()).toContain('No hay suficientes datos de compras');
      expect(queryUno('canvas')).toBeNull();
    });
  });

  describe('procesarHistorial', () => {
    it('dado status ENTREGADO, COMPLETADA y APROBADO, deberia incluirlos en el dataset', () => {
      givenHistorial([
        MovimientoMother.crear({ status: 'ENTREGADO', date: '2026-06-05T10:00:00Z', totalAmount: 100 }),
        MovimientoMother.crear({ status: 'COMPLETADA', date: '2026-06-06T10:00:00Z', totalAmount: 200 }),
        MovimientoMother.crear({ status: 'APROBADO', date: '2026-06-07T10:00:00Z', totalAmount: 300 }),
      ]);

      expect(datasetData()).toEqual([100, 200, 300]);
    });

    it('dado tipo PRESENCIAL, deberia incluirlo aunque el status no sea uno de los aprobados', () => {
      givenHistorial([
        MovimientoMother.crear({
          status: 'PENDIENTE',
          tipo: 'PRESENCIAL',
          date: '2026-06-05T10:00:00Z',
          totalAmount: 800,
        }),
      ]);

      expect(datasetData()).toEqual([800]);
    });

    it('dado varios movimientos del mismo dia, deberia sumar los totales en una unica entrada', () => {
      givenHistorial([
        MovimientoMother.crear({ status: 'ENTREGADO', date: '2026-06-05T10:00:00Z', totalAmount: 1000 }),
        MovimientoMother.crear({ status: 'APROBADO', date: '2026-06-05T15:00:00Z', totalAmount: 500 }),
      ]);

      expect(component.lineChartData.labels?.length).toBe(1);
      expect(datasetData()).toEqual([1500]);
    });

    it('dado movimientos en distintos dias desordenados, deberia devolverlos ordenados cronologicamente', () => {
      givenHistorial([
        MovimientoMother.crear({ status: 'ENTREGADO', date: '2026-06-10T10:00:00Z', totalAmount: 1000 }),
        MovimientoMother.crear({ status: 'ENTREGADO', date: '2026-06-05T10:00:00Z', totalAmount: 500 }),
        MovimientoMother.crear({ status: 'ENTREGADO', date: '2026-06-07T10:00:00Z', totalAmount: 200 }),
      ]);

      expect(datasetData()).toEqual([500, 200, 1000]);
    });

    it('dado movimientos filtrados en su totalidad, deberia dejar dataset y labels vacios', () => {
      givenHistorial([
        MovimientoMother.crear({ status: 'PENDIENTE', date: '2026-06-05T10:00:00Z' }),
      ]);

      expect(component.lineChartData.labels).toEqual([]);
      expect(datasetData()).toEqual([]);
    });

    it('dado historial vacio, no deberia procesarlo (mantiene el dataset inicial vacio)', () => {
      givenHistorial([]);

      expect(component.lineChartData.labels).toEqual([]);
      expect(datasetData()).toEqual([]);
    });
  });

  describe('tooltip callback', () => {
    interface FakeTooltipContext {
      dataset: { label?: string };
      parsed: { y: number | null };
    }

    function invocarTooltipLabel(context: FakeTooltipContext): string {
      const cb = component.lineChartOptions!.plugins!.tooltip!.callbacks!.label!;
      return cb.call({} as never, context as never) as string;
    }

    it('dado dataset con label y y numerico, deberia devolver "label: $monto"', () => {
      const resultado = invocarTooltipLabel({
        dataset: { label: 'Gasto Diario' },
        parsed: { y: 1500 },
      });

      expect(resultado).toContain('Gasto Diario:');
      expect(resultado).toContain('1.500');
    });

    it('dado dataset sin label (string vacio), no deberia anteponer ": "', () => {
      const resultado = invocarTooltipLabel({
        dataset: { label: '' },
        parsed: { y: 100 },
      });

      expect(resultado.startsWith(':')).toBeFalse();
      expect(resultado).toContain('100');
    });

    it('dado parsed.y null, deberia devolver solo el label sin monto', () => {
      const resultado = invocarTooltipLabel({
        dataset: { label: 'Gasto Diario' },
        parsed: { y: null },
      });

      expect(resultado).toBe('Gasto Diario: ');
    });
  });

  function givenHistorial(historial: Movimiento[]): void {
    component.historial = historial;
    component.ngOnChanges({
      historial: {
        currentValue: historial,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
  }

  function datasetData(): number[] {
    return component.lineChartData.datasets[0].data as number[];
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
