import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart, ChartConfiguration } from 'chart.js';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import {
  BudgetSummaryMother,
  ChildDashboardSummaryMother,
  HealthSummaryMother,
  ScheduledPickupMother,
  STUDENT_ID_TEST,
} from '../../tutor-dashboard.mother';
import { SmartChartWidget } from './smart-chart-widget';

interface FakeChartElement {
  tooltipPosition(useFinalPosition: boolean): { x: number; y: number } | null;
}

interface FakeDatasetMeta {
  data: FakeChartElement[];
}

interface FakeCtx {
  font: string;
  fillStyle: string | CanvasGradient | CanvasPattern;
  textAlign: string;
  textBaseline: string;
  save: jasmine.Spy;
  restore: jasmine.Spy;
  fillText: jasmine.Spy;
}

interface FakeChart {
  ctx: FakeCtx;
  data: { datasets: { label: string; data: (number | null | undefined)[] }[] };
  config: { type: ChartConfiguration['type'] };
  getDatasetMeta(idx: number): FakeDatasetMeta;
}

function crearFakeCtx(): FakeCtx {
  return {
    font: '',
    fillStyle: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    save: jasmine.createSpy('save'),
    restore: jasmine.createSpy('restore'),
    fillText: jasmine.createSpy('fillText'),
  };
}

function crearFakeChart(
  datasets: { label: string; data: (number | null | undefined)[] }[],
  type: ChartConfiguration['type'] = 'bar',
  posiciones: (({ x: number; y: number } | null)[])[] = [],
): FakeChart {
  return {
    ctx: crearFakeCtx(),
    data: { datasets },
    config: { type },
    getDatasetMeta(idx: number): FakeDatasetMeta {
      const posesDataset = posiciones[idx] ?? datasets[idx].data.map(() => ({ x: 10, y: 20 }));
      return {
        data: posesDataset.map(pos => ({
          tooltipPosition: () => pos,
        })),
      };
    },
  };
}

describe('SmartChartWidget', () => {
  let component: SmartChartWidget;
  let fixture: ComponentFixture<SmartChartWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartChartWidget],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartChartWidget);
    component = fixture.componentInstance;
    component.children = ChildDashboardSummaryMother.crearVarios();
  });

  describe('ngOnInit', () => {
    it('dado un config sin childId, cuando inicializo, deberia elegir el primer hijo', () => {
      component.config = {};

      whenMonto();

      expect(component.selectedChildId).toBe(STUDENT_ID_TEST);
      expect(component.selectedChartType).toBe('bar');
      expect(component.selectedDataSource).toBe('finance');
    });

    it('dado un config con childId y chartType, cuando inicializo, deberia respetarlos', () => {
      component.config = { childId: 'student-2', chartType: 'pie', dataSource: 'health' };

      whenMonto();

      expect(component.selectedChildId).toBe('student-2');
      expect(component.selectedChartType).toBe('pie');
      expect(component.selectedDataSource).toBe('health');
    });
  });

  describe('updateChart', () => {
    beforeEach(() => whenMonto());

    it('dado dataSource finance, cuando actualizo el chart, deberia mapear presupuesto/gastado/balance', () => {
      component.selectedDataSource = 'finance';
      component.updateChart();

      expect(component.chartData.labels).toEqual(['Presupuesto', 'Gastado', 'Saldo Disponible']);
      expect(component.chartData.datasets[0].data).toEqual([2000, 500, 1500]);
    });

    it('dado dataSource health, cuando actualizo el chart, deberia mapear puntos y faltantes', () => {
      component.selectedDataSource = 'health';
      component.updateChart();

      expect(component.chartData.labels).toEqual([
        'Puntos Obtenidos',
        'Faltan p/ Siguiente Nivel',
      ]);
      expect(component.chartData.datasets[0].data).toEqual([150, 50]);
    });

    it('dado dataSource logistics, cuando actualizo el chart, deberia mapear retiros pendientes', () => {
      component.selectedDataSource = 'logistics';
      component.updateChart();

      expect(component.chartData.labels).toEqual(['Retiros Pendientes', 'Retiros Completados']);
      expect(component.chartData.datasets[0].data).toEqual([1, 0]);
    });

    it('dado un hijo sin budget/health/todayPickups, cuando actualizo, deberia devolver ceros', () => {
      component.children = [
        ChildDashboardSummaryMother.crear({
          studentId: 'student-vacio',
          budget: undefined,
          health: HealthSummaryMother.crear({ rewardPoints: 0, pointsToNextLevel: 0 }),
          todayPickups: [],
          balance: 0,
        }),
      ];
      component.selectedChildId = 'student-vacio';

      component.selectedDataSource = 'finance';
      component.updateChart();
      expect(component.chartData.datasets[0].data).toEqual([0, 0, 0]);

      component.selectedDataSource = 'health';
      component.updateChart();
      expect(component.chartData.datasets[0].data).toEqual([0, 0]);

      component.selectedDataSource = 'logistics';
      component.updateChart();
      expect(component.chartData.datasets[0].data).toEqual([0, 0]);
    });

    it('dado un childId inexistente, cuando actualizo, no deberia modificar el chart', () => {
      const dataAnterior = component.chartData.datasets[0].data;
      component.selectedChildId = 'no-existe';

      component.updateChart();

      expect(component.chartData.datasets[0].data).toBe(dataAnterior);
    });
  });

  describe('onConfigChange', () => {
    it('cuando cambio la config, deberia emitir configChange con los valores actuales', () => {
      whenMonto();
      spyOn(component.configChange, 'emit');
      component.selectedChildId = 'student-2';
      component.selectedChartType = 'line';
      component.selectedDataSource = 'health';

      component.onConfigChange();

      expect(component.configChange.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          childId: 'student-2',
          chartType: 'line',
          dataSource: 'health',
        }),
      );
    });
  });

  describe('onClose', () => {
    it('cuando hago click en cerrar, deberia emitir closeCard', () => {
      whenMonto();
      spyOn(component.closeCard, 'emit');

      component.onClose();

      expect(component.closeCard.emit).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('dado un cambio de children posterior al firstChange, cuando ngOnChanges, deberia actualizar el chart', () => {
      whenMonto();
      spyOn(component, 'updateChart');

      component.ngOnChanges({
        children: new SimpleChange([], component.children, false),
      });

      expect(component.updateChart).toHaveBeenCalled();
    });

    it('dado el primer cambio de children, cuando ngOnChanges, no deberia actualizar el chart', () => {
      whenMonto();
      spyOn(component, 'updateChart');

      component.ngOnChanges({
        children: new SimpleChange(undefined, component.children, true),
      });

      expect(component.updateChart).not.toHaveBeenCalled();
    });
  });

  describe('getBackgroundColors (con children extra data)', () => {
    it('dado un tipo desconocido con chart bar, deberia usar el gradiente por defecto', () => {
      whenMonto();
      const context = { chart: { ctx: {} as CanvasRenderingContext2D } };

      const color = component.getBackgroundColors(context, 'desconocido');

      expect(color).toBe('#81B29A');
    });

    describe('con selectedChartType pie/doughnut', () => {
      beforeEach(() => {
        whenMonto();
        component.selectedChartType = 'pie';
      });

      it('dado finance con index 0, deberia devolver gris (Presupuesto)', () => {
        const color = component.getBackgroundColors(givenContext(0), 'finance');

        expect(color).toBe('#e2e8f0');
      });

      it('dado finance con index 1, deberia devolver rojo (Gastado)', () => {
        const color = component.getBackgroundColors(givenContext(1), 'finance');

        expect(color).toBe('#ef4444');
      });

      it('dado finance con index 2 y chartArea, deberia devolver el gradient del Saldo', () => {
        const gradientFake = { addColorStop: jasmine.createSpy('addColorStop') } as unknown as CanvasGradient;
        const color = component.getBackgroundColors(
          givenContextConGradient(2, gradientFake),
          'finance',
        );

        expect(color).toBe(gradientFake);
      });

      it('dado health con index 0, deberia devolver el gradient', () => {
        const gradientFake = { addColorStop: jasmine.createSpy('addColorStop') } as unknown as CanvasGradient;
        const color = component.getBackgroundColors(
          givenContextConGradient(0, gradientFake),
          'health',
        );

        expect(color).toBe(gradientFake);
      });

      it('dado health con index 1, deberia devolver gris', () => {
        const color = component.getBackgroundColors(givenContext(1), 'health');

        expect(color).toBe('#e2e8f0');
      });

      it('dado logistics con index 0, deberia devolver ambar (Retiros Pendientes)', () => {
        const color = component.getBackgroundColors(givenContext(0), 'logistics');

        expect(color).toBe('#f59e0b');
      });

      it('dado logistics con index 1, deberia devolver el gradient (Retiros Completados)', () => {
        const gradientFake = { addColorStop: jasmine.createSpy('addColorStop') } as unknown as CanvasGradient;
        const color = component.getBackgroundColors(
          givenContextConGradient(1, gradientFake),
          'logistics',
        );

        expect(color).toBe(gradientFake);
      });

      it('dado un tipo desconocido con chart pie, deberia caer al gradient por defecto', () => {
        const gradientFake = { addColorStop: jasmine.createSpy('addColorStop') } as unknown as CanvasGradient;
        const color = component.getBackgroundColors(
          givenContextConGradient(0, gradientFake),
          'otro',
        );

        expect(color).toBe(gradientFake);
      });
    });
  });

  describe('getBarGradient', () => {
    beforeEach(() => whenMonto());

    it('dado un contexto sin chartArea, deberia devolver el colorEnd como fallback', () => {
      const context = { chart: { ctx: {} as CanvasRenderingContext2D } };

      const color = component.getBarGradient(context, '#111111', '#222222');

      expect(color).toBe('#222222');
    });

    it('dado un contexto con chartArea, deberia crear un linear gradient con los stops', () => {
      const gradientFake = { addColorStop: jasmine.createSpy('addColorStop') } as unknown as CanvasGradient;
      const ctx = jasmine.createSpyObj<CanvasRenderingContext2D>('ctx', ['createLinearGradient']);
      ctx.createLinearGradient.and.returnValue(gradientFake);
      const context = {
        chart: {
          ctx,
          chartArea: { top: 0, bottom: 100, left: 0, right: 200 },
        },
      };

      const color = component.getBarGradient(context, '#111111', '#222222');

      expect(color).toBe(gradientFake);
      expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 100, 0, 0);
      expect(gradientFake.addColorStop).toHaveBeenCalledWith(0, '#111111');
      expect(gradientFake.addColorStop).toHaveBeenCalledWith(1, '#222222');
    });
  });

  describe('chartPlugins.afterDatasetsDraw', () => {
    let previousTheme: string | null;

    beforeEach(() => {
      whenMonto();
      previousTheme = document.documentElement.getAttribute('data-theme');
    });

    afterEach(() => {
      if (previousTheme === null) {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', previousTheme);
      }
    });

    it('dado dark mode y labels de Finanzas, deberia pintar valores con formato $', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const chart = crearFakeChart([{ label: 'Finanzas ($)', data: [1500] }]);

      whenPluginDibuja(chart);

      expect(chart.ctx.fillStyle).toBe('#cbd5e1');
      expect(chart.ctx.fillText).toHaveBeenCalledWith(
        `$${(1500).toLocaleString('es-AR')}`,
        10,
        14,
      );
      expect(chart.ctx.save).toHaveBeenCalled();
      expect(chart.ctx.restore).toHaveBeenCalled();
    });

    it('dado light mode y label de Salud, deberia formatear con pts', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      const chart = crearFakeChart([{ label: 'Salud (Pts)', data: [200] }]);

      whenPluginDibuja(chart);

      expect(chart.ctx.fillStyle).toBe('#475569');
      expect(chart.ctx.fillText).toHaveBeenCalledWith(
        `${(200).toLocaleString('es-AR')} pts`,
        10,
        14,
      );
    });

    it('dado label de Logistica, deberia formatear el numero sin unidad', () => {
      const chart = crearFakeChart([{ label: 'Logística de Entregas', data: [3] }]);

      whenPluginDibuja(chart);

      expect(chart.ctx.fillText).toHaveBeenCalledWith(
        `${(3).toLocaleString('es-AR')}`,
        10,
        14,
      );
    });

    it('dado un chart pie, deberia salir sin pintar labels', () => {
      const chart = crearFakeChart([{ label: 'Finanzas ($)', data: [100] }], 'pie');

      whenPluginDibuja(chart);

      expect(chart.ctx.fillText).not.toHaveBeenCalled();
    });

    it('dado valores null o undefined, deberia saltearlos', () => {
      const chart = crearFakeChart([
        { label: 'Finanzas ($)', data: [null, undefined, 500] },
      ]);

      whenPluginDibuja(chart);

      expect(chart.ctx.fillText).toHaveBeenCalledTimes(1);
      expect(chart.ctx.fillText).toHaveBeenCalledWith(
        `$${(500).toLocaleString('es-AR')}`,
        10,
        14,
      );
    });

    it('dado una posicion invalida, no deberia pintar el label', () => {
      const chart = crearFakeChart(
        [{ label: 'Finanzas ($)', data: [100] }],
        'bar',
        [[null]],
      );

      whenPluginDibuja(chart);

      expect(chart.ctx.fillText).not.toHaveBeenCalled();
    });

    it('dado un label sin match conocido, deberia pintar el valor como string plano', () => {
      const chart = crearFakeChart([{ label: 'Otro', data: [42] }]);

      whenPluginDibuja(chart);

      expect(chart.ctx.fillText).toHaveBeenCalledWith('42', 10, 14);
    });

    function whenPluginDibuja(chart: FakeChart): void {
      const plugin = component.chartPlugins[0];
      plugin.afterDatasetsDraw(chart as unknown as Chart);
    }
  });

  function givenContext(dataIndex: number) {
    return { chart: { ctx: {} as CanvasRenderingContext2D }, dataIndex };
  }

  function givenContextConGradient(dataIndex: number, gradient: CanvasGradient) {
    const ctx = jasmine.createSpyObj<CanvasRenderingContext2D>('ctx', ['createLinearGradient']);
    ctx.createLinearGradient.and.returnValue(gradient);
    return {
      chart: {
        ctx,
        chartArea: { top: 0, bottom: 100, left: 0, right: 200 },
      },
      dataIndex,
    };
  }

  function whenMonto(): void {
    component.children = component.children.length
      ? component.children
      : ChildDashboardSummaryMother.crearVarios();
    if (!component.children[0].budget) {
      component.children[0] = ChildDashboardSummaryMother.crear({
        ...component.children[0],
        budget: BudgetSummaryMother.crear(),
      });
    }
    if (component.children[0].todayPickups.length === 0) {
      component.children[0] = ChildDashboardSummaryMother.crear({
        ...component.children[0],
        todayPickups: [ScheduledPickupMother.crear()],
      });
    }
    component.ngOnInit();
    fixture.detectChanges();
  }
});
