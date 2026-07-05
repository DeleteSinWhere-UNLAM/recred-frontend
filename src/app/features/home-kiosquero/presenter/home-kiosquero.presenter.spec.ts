import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilMother } from '../../../data-access/services/alumno.mother';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { EventoInventarioRealtime } from '../../inventario/models/inventario.interface';
import { InventarioRealtimeService } from '../../inventario/services/inventario-realtime.service';
import {
  BUFFET_ID_TEST,
  PanelKiosqueroActivityMother,
  PanelKiosqueroAlertsMother,
  PanelKiosqueroMother,
  PanelKiosqueroSummaryMother,
} from '../home-kiosquero.mother';
import { PanelKiosquero } from '../models/panel-kiosquero.model';
import { HomeKiosqueroService } from '../services/home-kiosquero.service';
import { HomeKiosqueroPresenter } from './home-kiosquero.presenter';

describe('HomeKiosqueroPresenter', () => {
  let presenter: HomeKiosqueroPresenter;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioHomeKiosquero: jasmine.SpyObj<HomeKiosqueroService>;
  let servicioRealtime: jasmine.SpyObj<InventarioRealtimeService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
      'obtenerBuffetId',
    ]);
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'setNombreNavbar',
    ]);

    servicioHomeKiosquero = jasmine.createSpyObj<HomeKiosqueroService>('HomeKiosqueroService', [
      'getPanel',
      'getPanelByRange',
      'getNombreKiosquero',
    ]);
    servicioRealtime = jasmine.createSpyObj<InventarioRealtimeService>('InventarioRealtimeService', [
      'connect',
      'recordRefetch',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);

    servicioPerfil.getPerfil.and.returnValue(
      PerfilMother.crear({ id: 'perfil-1', rol: 'VENDEDOR', buffetId: BUFFET_ID_TEST }),
    );
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID_TEST);
    servicioHomeKiosquero.getNombreKiosquero.and.returnValue('Carlos');
    servicioHomeKiosquero.getPanel.and.returnValue(of(PanelKiosqueroMother.crear()));
    servicioHomeKiosquero.getPanelByRange.and.returnValue(of(PanelKiosqueroMother.crear()));
    servicioRealtime.connect.and.returnValue(new AbortController());

    TestBed.configureTestingModule({
      providers: [
        HomeKiosqueroPresenter,
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: HomeKiosqueroService, useValue: servicioHomeKiosquero },
        { provide: InventarioRealtimeService, useValue: servicioRealtime },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(HomeKiosqueroPresenter);
    presenter.init();
  });

  describe('init', () => {
    it('dado el presenter, cuando inicializa, deberia suscribirse a realtime del buffet', () => {
      expect(servicioRealtime.connect).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        jasmine.objectContaining({
          onRefresh: jasmine.any(Function),
          onError: jasmine.any(Function),
        }),
      );
    });
  });

  describe('operationalCards (desde alerts)', () => {
    it('dado alerts pendingOrders=99, readyOrders=3, expiredOrders=1, deberia armar las 3 cards operativas', () => {
      const cards = presenter.operationalCards();

      expect(cards.map((c) => [c.label, c.value])).toEqual([
        ['A preparar', '4'],
        ['Ya listos', '3'],
        ['Vencidos', '1'],
      ]);
    });
  });

  describe('stockOverview y criticalProductGroups', () => {
    it('dado summary soldOutProducts=7 y products con 1 agotado y 1 bajo stock, deberia armar las metricas y grupos criticos', () => {
      expect(presenter.stockOverview().map((m) => [m.label, m.value])).toEqual([
        ['Agotados', '7'],
        ['Bajo stock', '1'],
      ]);

      const criticalGroups = presenter.criticalProductGroups();
      expect(criticalGroups[0].title).toBe('Productos sin stock');
      expect(criticalGroups[0].countLabel).toBe('7');
      expect(criticalGroups[0].items.map((i) => i.label)).toEqual(['Jugo']);

      expect(criticalGroups[1].title).toBe('Productos bajo stock');
      expect(criticalGroups[1].items.map((i) => i.label)).toEqual(['Alfajor']);
    });
  });

  describe('acciones', () => {
    it('dado el presenter, deberia exponer todas las acciones operativas con el orden esperado', () => {
      expect(presenter.acciones().map((a) => a.id)).toEqual([
        'ver-pedidos',
        'venta-espontanea',
        'cargar-productos',
        'tracking-pedidos',
        'stock',
        'inteligencia-comercial',
        'reportes',
        'recomendaciones',
        'promociones',
        'cierre-diario',
        'proveedores',
      ]);
    });

    it('dado el presenter, deberia exponer las 4 acciones destacadas', () => {
      expect(presenter.featuredActions().map((a) => a.id)).toEqual([
        'venta-espontanea',
        'cargar-productos',
        'inteligencia-comercial',
        'cierre-diario',
      ]);
    });

    it('dado el presenter, deberia exponer proveedores como accion secundaria', () => {
      expect(presenter.secondaryActions().map((a) => a.id)).toEqual(['proveedores']);
    });
  });

  describe('ventas por categoria', () => {
    it('dado categoria Golosinas con 8u y 12000$, deberia formatear cantidad, monto y porcentajes', () => {
      const categorias = presenter.salesByCategory();

      expect(categorias.map((c) => c.categoryName)).toEqual(['Golosinas', 'Sin categoria']);
      expect(categorias[0].quantityLabel).toBe('8 unidades');
      expect(categorias[0].totalLabel).toContain('12.000');
      expect(categorias[0].barPercent).toBe(100);
      expect(categorias[1].barPercent).toBe(50);
      expect(categorias[0].totalPercent).toBe(42.1);
      expect(categorias[0].totalPercentLabel).toBe('42,1%');
      expect(categorias[1].totalPercent).toBe(21.1);
      expect(categorias[1].totalPercentLabel).toBe('21,1%');
    });
  });

  describe('ventas por franja horaria', () => {
    it('dado una franja "Compra espontanea" sin horario y "Primer recreo", deberia redistribuir la espontanea en la franja con horario', () => {
      const slots = presenter.salesByTimeSlot();

      expect(slots.map((s) => s.timeSlot)).toEqual(['Primer recreo']);
      expect(slots[0].timeRangeLabel).toBe('09:30 - 09:45');
      expect(slots[0].orders).toBe(5);
      expect(slots[0].ordersLabel).toBe('5 pedidos');
      expect(slots[0].totalSold).toBe(8000);
      expect(slots[0].totalSoldLabel).toContain('$');
      expect(slots[0].totalSoldLabel).toContain('8.000');
      expect(slots[0].percent).toBe(100);
    });
  });

  describe('tipos de compra', () => {
    it('dado 8 presencial y 4 anticipada, deberia formatear label, share y porcentaje', () => {
      const tipos = presenter.ordersByPurchaseType();

      expect(tipos.map((t) => [t.label, t.shareLabel, t.percentLabel])).toEqual([
        ['Presencial', '8 de 12 compras', '67%'],
        ['Anticipada', '4 de 12 compras', '33%'],
      ]);
    });
  });

  describe('initReportes', () => {
    it('dado initReportes, deberia consultar dashboard por rango de ultimos 7 dias y 1 dia para metricas', () => {
      presenter.initReportes();

      const [metricsBuffetId, metricsRange] =
        servicioHomeKiosquero.getPanelByRange.calls.argsFor(0);
      const [trendBuffetId, trendRange] =
        servicioHomeKiosquero.getPanelByRange.calls.argsFor(1);

      expect(metricsBuffetId).toBe(BUFFET_ID_TEST);
      expect(metricsRange.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(metricsRange.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(countInclusiveDays(metricsRange.from, metricsRange.to)).toBe(1);
      expect(metricsRange.from).toBe(metricsRange.to);

      expect(trendBuffetId).toBe(BUFFET_ID_TEST);
      expect(countInclusiveDays(trendRange.from, trendRange.to)).toBe(7);
    });

    it('dado salesByDay en trends, deberia usarlo para trendDays y exponer el desglose de estados', () => {
      const reportPanel: PanelKiosquero = PanelKiosqueroMother.crear({
        trends: {
          lastSevenDays: [
            { date: '2026-06-01', totalSold: 1, totalOrders: 1, deliveredOrders: 1 },
          ],
          salesByDay: [
            {
              date: '2026-06-14',
              totalSold: 12000,
              totalOrders: 7,
              deliveredOrders: 3,
              createdOrders: 7,
              pendingOrders: 1,
              inPreparationOrders: 1,
              readyOrders: 1,
              cancelledOrders: 1,
              rejectedOrders: 1,
              expiredOrders: 0,
            },
          ],
        },
      });
      servicioHomeKiosquero.getPanelByRange.and.returnValue(of(reportPanel));

      presenter.initReportes();

      const day = presenter.trendDays()[0];
      const breakdown = presenter.selectedTrendBreakdown();

      expect(day.date).toBe('2026-06-14');
      expect(day.createdOrdersLabel).toBe('7 pedidos hechos');
      expect(day.deliveredOrdersLabel).toBe('3 entregados');
      expect(day.nonDeliveredOrdersLabel).toBe('4 no entregados');
      expect(breakdown.map((i) => [i.label, i.value, i.tone])).toContain([
        'Cancelados',
        '1',
        'danger',
      ]);
      expect(breakdown.map((i) => [i.label, i.value, i.tone])).toContain([
        'Rechazados',
        '1',
        'danger',
      ]);
    });
  });

  describe('navegacion', () => {
    it('dado un status, cuando abro pedidos, deberia navegar a /kiosquero/pedidos-tracking con fecha y status como queryParams', () => {
      presenter.abrirPedidos('LISTO');

      expect(router.navigate).toHaveBeenCalledOnceWith(['/kiosquero/pedidos-tracking'], {
        queryParams: { date: presenter.selectedDate(), status: 'LISTO' },
      });
    });

    it('dado un producto critico, cuando repongo stock, deberia navegar a /admin-productos con el productId', () => {
      const criticalItem = presenter.criticalProductGroups()[0].items[0];

      presenter.reponerStock(criticalItem);

      expect(router.navigate).toHaveBeenCalledWith(['/admin-productos'], {
        queryParams: { productId: 'sold-out-1' },
      });
    });

    it('dado el presenter, cuando abro stock, deberia navegar a /admin-productos', () => {
      presenter.abrirStock();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
    });

    it('dado el presenter, cuando abro reportes, deberia navegar a /kiosquero/reportes', () => {
      presenter.abrirReportes();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/reportes');
    });

    it('dado la accion promociones, cuando la ejecuto, deberia navegar a /promociones', () => {
      const promociones = presenter.acciones().find((a) => a.id === 'promociones');
      expect(promociones).toBeDefined();

      presenter.ejecutarAccion(promociones!);

      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });
  });

  describe('init con perfil o buffet ausentes', () => {
    it('dado buffetId null, deberia setear errorMessage y no llamar a getPanel/connect', () => {
      servicioPerfil.obtenerBuffetId.and.returnValue(null);
      servicioHomeKiosquero.getPanel.calls.reset();
      servicioRealtime.connect.calls.reset();

      presenter.init();

      expect(presenter.errorMessage()).toBe('No se encontró un buffet asociado a tu perfil.');
      expect(servicioHomeKiosquero.getPanel).not.toHaveBeenCalled();
      expect(servicioRealtime.connect).not.toHaveBeenCalled();
    });

    it('dado perfil null, deberia usar el nombre del servicio kiosquero', () => {
      servicioPerfil.getPerfil.and.returnValue(null);
      servicioHomeKiosquero.getNombreKiosquero.and.returnValue('Fallback');

      presenter.init();

      expect(presenter.nombreKiosquero()).toBe('Fallback');
      expect(servicioUsuario.setNombreNavbar).toHaveBeenCalledWith('Fallback');
    });
  });

  describe('initReportes sin buffetId', () => {
    it('dado buffetId null, deberia setear errorMessage sin cargar', () => {
      servicioPerfil.obtenerBuffetId.and.returnValue(null);
      servicioHomeKiosquero.getPanelByRange.calls.reset();

      presenter.initReportes();

      expect(presenter.errorMessage()).toBe('No se encontró un buffet asociado a tu perfil.');
      expect(servicioHomeKiosquero.getPanelByRange).not.toHaveBeenCalled();
    });

    it('dado perfil null, deberia usar el nombre del servicio kiosquero', () => {
      servicioPerfil.getPerfil.and.returnValue(null);
      servicioHomeKiosquero.getNombreKiosquero.and.returnValue('Fallback');

      presenter.initReportes();

      expect(presenter.nombreKiosquero()).toBe('Fallback');
    });
  });

  describe('onDateChange', () => {
    beforeEach(() => {
      servicioHomeKiosquero.getPanel.calls.reset();
    });

    it('dado una fecha nueva, deberia setearla y recargar el panel', () => {
      const inputEl = givenInputEvent('2030-01-15');

      presenter.onDateChange(inputEl);

      expect(presenter.selectedDate()).toBe('2030-01-15');
      expect(servicioHomeKiosquero.getPanel).toHaveBeenCalledWith(BUFFET_ID_TEST, '2030-01-15');
    });

    it('dado una fecha igual a la actual, no deberia recargar', () => {
      const fechaActual = presenter.selectedDate();
      const inputEl = givenInputEvent(fechaActual);

      presenter.onDateChange(inputEl);

      expect(servicioHomeKiosquero.getPanel).not.toHaveBeenCalled();
    });

    it('dado un evento sin target, no deberia romper', () => {
      const evento = { target: null } as unknown as Event;

      presenter.onDateChange(evento);

      expect(servicioHomeKiosquero.getPanel).not.toHaveBeenCalled();
    });
  });

  describe('onReportRangePresetChange', () => {
    beforeEach(() => {
      servicioHomeKiosquero.getPanelByRange.calls.reset();
    });

    it('dado un preset LAST_7_DAYS, deberia setearlo y recargar reportes', () => {
      const inputEl = givenSelectEvent('LAST_7_DAYS');

      presenter.onReportRangePresetChange(inputEl);

      expect(presenter.selectedRangePreset()).toBe('LAST_7_DAYS');
      expect(servicioHomeKiosquero.getPanelByRange).toHaveBeenCalled();
    });

    it('dado un preset CUSTOM, deberia setearlo sin recargar', () => {
      const inputEl = givenSelectEvent('CUSTOM');

      presenter.onReportRangePresetChange(inputEl);

      expect(presenter.selectedRangePreset()).toBe('CUSTOM');
      expect(servicioHomeKiosquero.getPanelByRange).not.toHaveBeenCalled();
    });

    it('dado un valor invalido, no deberia setear ni recargar', () => {
      const inputEl = givenSelectEvent('INVALIDO');

      presenter.onReportRangePresetChange(inputEl);

      expect(servicioHomeKiosquero.getPanelByRange).not.toHaveBeenCalled();
    });
  });

  describe('onReportRangeFromChange y onReportRangeToChange', () => {
    beforeEach(() => {
      servicioHomeKiosquero.getPanelByRange.calls.reset();
    });

    it('dado nueva fecha desde dentro de un rango valido, deberia setear CUSTOM y recargar', () => {
      const nuevaFecha = addDaysToInputDate(presenter.reportRangeTo(), -30);
      const inputEl = givenInputEvent(nuevaFecha);

      presenter.onReportRangeFromChange(inputEl);

      expect(presenter.selectedRangePreset()).toBe('CUSTOM');
      expect(presenter.reportRangeFrom()).toBe(nuevaFecha);
      expect(servicioHomeKiosquero.getPanelByRange).toHaveBeenCalled();
    });

    it('dado fecha desde igual a la actual, no deberia recargar', () => {
      const actual = presenter.reportRangeFrom();
      const inputEl = givenInputEvent(actual);

      presenter.onReportRangeFromChange(inputEl);

      expect(servicioHomeKiosquero.getPanelByRange).not.toHaveBeenCalled();
    });

    it('dado nueva fecha hasta dentro de un rango valido, deberia setear CUSTOM y recargar', () => {
      const nuevaFecha = addDaysToInputDate(presenter.reportRangeFrom(), 30);
      const inputEl = givenInputEvent(nuevaFecha);

      presenter.onReportRangeToChange(inputEl);

      expect(presenter.selectedRangePreset()).toBe('CUSTOM');
      expect(presenter.reportRangeTo()).toBe(nuevaFecha);
      expect(servicioHomeKiosquero.getPanelByRange).toHaveBeenCalled();
    });

    it('dado fecha hasta igual a la actual, no deberia recargar', () => {
      const actual = presenter.reportRangeTo();
      const inputEl = givenInputEvent(actual);

      presenter.onReportRangeToChange(inputEl);

      expect(servicioHomeKiosquero.getPanelByRange).not.toHaveBeenCalled();
    });

    it('dado un rango invertido (from > to), deberia setear errorMessage', () => {
      presenter.onReportRangeFromChange(givenInputEvent('2030-06-30'));
      servicioHomeKiosquero.getPanelByRange.calls.reset();

      presenter.onReportRangeToChange(givenInputEvent('2030-01-01'));

      expect(presenter.errorMessage()).toBe('El rango de fechas no es válido para el dashboard.');
    });
  });

  describe('refrescar y selectTrendDay', () => {
    it('dado refrescarPanel, deberia llamar a getPanel de nuevo', () => {
      servicioHomeKiosquero.getPanel.calls.reset();

      presenter.refrescarPanel();

      expect(servicioHomeKiosquero.getPanel).toHaveBeenCalled();
    });

    it('dado refrescarReportes, deberia llamar a getPanelByRange', () => {
      servicioHomeKiosquero.getPanelByRange.calls.reset();

      presenter.refrescarReportes();

      expect(servicioHomeKiosquero.getPanelByRange).toHaveBeenCalled();
    });

    it('dado selectTrendDay, deberia setear la fecha como seleccionada', () => {
      const panel = PanelKiosqueroMother.crear({
        trends: {
          lastSevenDays: [
            { date: '2026-06-14', totalSold: 5000, totalOrders: 5, deliveredOrders: 5 },
            { date: '2026-06-15', totalSold: 7000, totalOrders: 6, deliveredOrders: 6 },
          ],
        },
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));
      presenter.init();

      presenter.selectTrendDay('2026-06-14');

      expect(presenter.selectedTrendDay()?.date).toBe('2026-06-14');
    });
  });

  describe('errores del backend', () => {
    it('dado que getPanel falla, deberia setear errorMessage y limpiar panel', () => {
      servicioHomeKiosquero.getPanel.and.returnValue(throwError(() => new Error('boom')));

      presenter.init();

      expect(presenter.errorMessage()).toBe('No se pudo cargar el estado del buffet.');
      expect(presenter.panel()).toBeNull();
    });

    it('dado que getPanelByRange falla en reportes, deberia setear errorMessage', () => {
      servicioHomeKiosquero.getPanelByRange.and.returnValue(throwError(() => new Error('boom')));

      presenter.initReportes();

      expect(presenter.errorMessage()).toBe('No se pudo cargar el dashboard del período.');
    });

    it('dado que la tendencia falla, deberia limpiar trendPanel sin romper', () => {
      const panelOk = PanelKiosqueroMother.crear();
      let call = 0;
      servicioHomeKiosquero.getPanelByRange.and.callFake(() => {
        call += 1;
        if (call === 1) return of(panelOk);
        return throwError(() => new Error('boom'));
      });

      presenter.initReportes();

      expect(presenter.panel()).not.toBeNull();
    });
  });

  describe('realtime — refresh y desconexion', () => {
    it('dado un evento DASHBOARD_CHANGED en modo home visible, deberia disparar recordRefetch y cargarPanel', fakeAsync(() => {
      const onRefreshRef: { current: ((event: EventoInventarioRealtime) => void) | null } = { current: null };
      servicioRealtime.connect.and.callFake(((_buffetId: string, handlers: { onRefresh: (event: EventoInventarioRealtime) => void }) => {
        onRefreshRef.current = handlers.onRefresh;
        return new AbortController();
      }) as typeof servicioRealtime.connect);
      spyOnProperty(document, 'visibilityState').and.returnValue('visible');

      presenter.init();
      servicioHomeKiosquero.getPanel.calls.reset();

      onRefreshRef.current!(crearEventoRealtime({
        type: 'DASHBOARD_CHANGED',
        date: presenter.selectedDate(),
      }));

      tick(2500);

      expect(servicioRealtime.recordRefetch).toHaveBeenCalledWith('home-kiosquero-panel');
      expect(servicioHomeKiosquero.getPanel).toHaveBeenCalled();
    }));

    it('dado un evento con type ajeno, no deberia disparar refresh', fakeAsync(() => {
      const onRefreshRef: { current: ((event: EventoInventarioRealtime) => void) | null } = { current: null };
      servicioRealtime.connect.and.callFake(((_id: string, handlers: { onRefresh: (event: EventoInventarioRealtime) => void }) => {
        onRefreshRef.current = handlers.onRefresh;
        return new AbortController();
      }) as typeof servicioRealtime.connect);
      spyOnProperty(document, 'visibilityState').and.returnValue('visible');

      presenter.init();
      servicioHomeKiosquero.getPanel.calls.reset();
      servicioRealtime.recordRefetch.calls.reset();

      onRefreshRef.current!(crearEventoRealtime({ type: 'OTRO_TYPE' }));
      tick(2500);

      expect(servicioRealtime.recordRefetch).not.toHaveBeenCalled();
    }));

    it('dado documento oculto, no deberia disparar refresh aunque el evento coincida', fakeAsync(() => {
      const onRefreshRef: { current: ((event: EventoInventarioRealtime) => void) | null } = { current: null };
      servicioRealtime.connect.and.callFake(((_id: string, handlers: { onRefresh: (event: EventoInventarioRealtime) => void }) => {
        onRefreshRef.current = handlers.onRefresh;
        return new AbortController();
      }) as typeof servicioRealtime.connect);
      spyOnProperty(document, 'visibilityState').and.returnValue('hidden');

      presenter.init();
      servicioRealtime.recordRefetch.calls.reset();

      onRefreshRef.current!(crearEventoRealtime({ type: 'DASHBOARD_CHANGED' }));
      tick(2500);

      expect(servicioRealtime.recordRefetch).not.toHaveBeenCalled();
    }));

    it('dado onError, deberia loggear un warning', () => {
      const spyConsole = spyOn(console, 'warn');
      const onErrorRef: { current: ((error: unknown) => void) | null } = { current: null };
      servicioRealtime.connect.and.callFake(((_id: string, handlers: { onRefresh: (event: EventoInventarioRealtime) => void; onError?: (error: unknown) => void }) => {
        onErrorRef.current = handlers.onError ?? null;
        return new AbortController();
      }) as typeof servicioRealtime.connect);

      presenter.init();
      onErrorRef.current!(new Error('sse fail'));

      expect(spyConsole).toHaveBeenCalledWith('SSE del panel desconectado o reintentando', jasmine.any(Error));
    });

    it('dado un modo reportes, el refresh deberia recordRefetch como kiosquero-reportes-panel', fakeAsync(() => {
      const onRefreshRef: { current: ((event: EventoInventarioRealtime) => void) | null } = { current: null };
      servicioRealtime.connect.and.callFake(((_id: string, handlers: { onRefresh: (event: EventoInventarioRealtime) => void }) => {
        onRefreshRef.current = handlers.onRefresh;
        return new AbortController();
      }) as typeof servicioRealtime.connect);
      spyOnProperty(document, 'visibilityState').and.returnValue('visible');

      presenter.initReportes();
      servicioHomeKiosquero.getPanelByRange.calls.reset();
      servicioRealtime.recordRefetch.calls.reset();

      onRefreshRef.current!(crearEventoRealtime({
        type: 'DASHBOARD_CHANGED',
        date: presenter.reportRangeTo(),
      }));
      tick(2500);

      expect(servicioRealtime.recordRefetch).toHaveBeenCalledWith('kiosquero-reportes-panel');
      expect(servicioHomeKiosquero.getPanelByRange).toHaveBeenCalled();
    }));
  });

  describe('saludo segun la hora', () => {
    it('dado antes del mediodia, deberia devolver "Buen día,"', () => {
      jasmine.clock().install();
      try {
        jasmine.clock().mockDate(new Date(2026, 5, 15, 9, 0));
        expect(presenter.saludo()).toBe('Buen día,');
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('dado entre las 12 y las 19, deberia devolver "Buenas tardes,"', () => {
      jasmine.clock().install();
      try {
        jasmine.clock().mockDate(new Date(2026, 5, 15, 15, 0));
        expect(presenter.saludo()).toBe('Buenas tardes,');
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('dado a partir de las 19, deberia devolver "Buenas noches,"', () => {
      jasmine.clock().install();
      try {
        jasmine.clock().mockDate(new Date(2026, 5, 15, 21, 0));
        expect(presenter.saludo()).toBe('Buenas noches,');
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });

  describe('iniciales', () => {
    it('dado nombre con dos palabras, deberia devolver dos iniciales', () => {
      servicioPerfil.getPerfil.and.returnValue(
        PerfilMother.crear({ nombre: 'Carlos', apellido: 'Perez' }),
      );

      presenter.init();

      expect(presenter.iniciales()).toBe('CP');
    });

    it('dado un solo nombre de 3 letras, deberia devolver 2 iniciales tomando dos letras del mismo', () => {
      servicioPerfil.getPerfil.and.returnValue(null);
      servicioHomeKiosquero.getNombreKiosquero.and.returnValue('Ada');

      presenter.init();

      expect(presenter.iniciales()).toBe('AD');
    });

    it('dado nombre vacio, deberia devolver string vacio', () => {
      servicioPerfil.getPerfil.and.returnValue(null);
      servicioHomeKiosquero.getNombreKiosquero.and.returnValue('');

      presenter.init();

      expect(presenter.iniciales()).toBe('');
    });
  });

  describe('urlFotoPerfil y summary computed', () => {
    it('dado perfil con foto, urlFotoPerfil deberia devolverla', () => {
      servicioPerfil.getPerfil.and.returnValue(
        PerfilMother.crear({ urlFotoPerfil: 'https://cdn/foto.png' }),
      );

      expect(presenter.urlFotoPerfil()).toBe('https://cdn/foto.png');
    });

    it('dado sin perfil, urlFotoPerfil deberia devolver null', () => {
      servicioPerfil.getPerfil.and.returnValue(null);

      expect(presenter.urlFotoPerfil()).toBeNull();
    });

    it('dado summary con ganancias, ventas y sin stock, los computed simples deberian exponerlos', () => {
      const panel = PanelKiosqueroMother.crear({
        summary: PanelKiosqueroSummaryMother.crear({
          totalSold: 10000,
          totalOrders: 20,
          soldOutProducts: 3,
        }),
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));

      presenter.init();

      expect(presenter.gananciasFormateadas()).toContain('10.000');
      expect(presenter.ventasHoy()).toBe(20);
      expect(presenter.productosSinStock()).toBe(3);
      expect(presenter.hasPanelData()).toBeTrue();
    });
  });

  describe('summary metrics con tones', () => {
    it('dado sin pedidos pendientes ni sin stock, esas metricas no deberian tener tone', () => {
      const panel = PanelKiosqueroMother.crear({
        summary: PanelKiosqueroSummaryMother.crear({ pendingOrders: 0, soldOutProducts: 0 }),
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));

      presenter.init();

      const metricas = presenter.summaryMetrics();
      const preparar = metricas.find((m) => m.label === 'A preparar');
      const sinStock = metricas.find((m) => m.label === 'Sin stock');
      expect(preparar?.tone).toBeUndefined();
      expect(sinStock?.tone).toBeUndefined();
    });

    it('dado ventasHoy 15/20, mainSummaryMetrics deberia mostrar "15 / 20" en entregados', () => {
      const panel = PanelKiosqueroMother.crear({
        summary: PanelKiosqueroSummaryMother.crear({ totalOrders: 20, deliveredOrders: 15 }),
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));

      presenter.init();

      const entregados = presenter.mainSummaryMetrics().find((m) => m.label === 'Entregados');
      expect(entregados?.value).toBe('15 / 20');
    });
  });

  describe('alertas visibles', () => {
    it('dado alerts con expiredOrders 0 y soldOutEvents 0, visibleAlertMetrics deberia filtrarlas', () => {
      const panel = PanelKiosqueroMother.crear({
        summary: PanelKiosqueroSummaryMother.crear(),
        alerts: PanelKiosqueroAlertsMother.crear({
          expiredOrders: 0,
          releasedReservations: 0,
          refundedCredits: 0,
          soldOutEvents: 0,
          pendingOrders: 0,
          readyOrders: 0,
          items: [],
        }),
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));

      presenter.init();

      expect(presenter.visibleAlertMetrics()).toEqual([]);
      expect(presenter.hasVisibleAlerts()).toBeFalse();
    });

    it('dado alerts con items positivos, visibleAlertItems deberia listarlos y hasVisibleAlerts true', () => {
      const panel = PanelKiosqueroMother.crear({
        alerts: PanelKiosqueroAlertsMother.crear({
          items: [
            { type: 'stock', label: 'Stock bajo', quantity: 3, amount: 0 },
            { type: 'refunds', label: 'Sin datos', quantity: 0, amount: 0 },
          ],
        }),
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));

      presenter.init();

      expect(presenter.visibleAlertItems().length).toBe(1);
      expect(presenter.hasVisibleAlerts()).toBeTrue();
    });
  });

  describe('primaryAction y trackers', () => {
    it('dado el presenter, primaryAction deberia ser "ver-pedidos"', () => {
      expect(presenter.primaryAction()?.id).toBe('ver-pedidos');
    });

    it('dado trackers, deberian devolver el key correcto de cada item', () => {
      expect(presenter.trackMetric(0, { label: 'x', value: '1', icon: 'i' })).toBe('x');
      expect(presenter.trackAttentionItem(0, { label: 'a', value: '1', icon: 'i', tone: 'warning' })).toBe('a');
      expect(presenter.trackStatus(0, { status: 'LISTO', label: 'Listo', orders: 1 })).toBe('LISTO');
      expect(presenter.trackPurchaseType(0, {
        type: 'ANTICIPADA',
        label: 'Anticipada',
        ordersLabel: '1',
        shareLabel: '1',
        percentLabel: '10%',
        percent: 10,
      })).toBe('ANTICIPADA');
      expect(presenter.trackProductGroup(0, {
        title: 'g',
        icon: 'i',
        emptyLabel: '',
        items: [],
      })).toBe('g');
      expect(presenter.trackProductItem(0, { id: 'p-1', label: 'x', detail: '' })).toBe('p-1');
      expect(presenter.trackAlertItem(0, {
        type: 'stock',
        label: 'x',
        quantity: 1,
        amount: 0,
        quantityLabel: '1',
        amountLabel: '$0',
      })).toBe('stock');
    });
  });

  describe('orderedStatusItems', () => {
    it('dado ordersByStatus incompleto, deberia rellenar con placeholders de orders=0', () => {
      const panel = PanelKiosqueroMother.crear({
        activity: PanelKiosqueroActivityMother.crear({
          ordersByStatus: [
            { status: 'LISTO', label: 'Listo para retirar', orders: 3 },
          ],
        }),
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));

      presenter.init();

      const items = presenter.orderedStatusItems();
      expect(items.length).toBe(7);
      const listo = items.find((i) => i.status === 'LISTO');
      expect(listo?.orders).toBe(3);
      const cancelado = items.find((i) => i.status === 'CANCELADO');
      expect(cancelado?.orders).toBe(0);
    });
  });

  describe('reportRangeLabel', () => {
    it('dado un preset no CUSTOM, deberia devolver el label del option', () => {
      presenter.onReportRangePresetChange(givenSelectEvent('LAST_7_DAYS'));

      expect(presenter.reportRangeLabel()).toBe('Última semana');
    });

    it('dado un preset CUSTOM, deberia devolver el rango formateado dd/mm/yyyy', () => {
      presenter.onReportRangeFromChange(givenInputEvent('2030-01-05'));
      presenter.onReportRangeToChange(givenInputEvent('2030-01-15'));

      expect(presenter.reportRangeLabel()).toBe('05/01/2030 al 15/01/2030');
    });
  });

  describe('trendSubtitle', () => {
    it('dado un preset TODAY, deberia mostrar solo el label de dias', () => {
      const panel = PanelKiosqueroMother.crear({
        trends: {
          lastSevenDays: [
            { date: '2026-06-14', totalSold: 1, totalOrders: 1, deliveredOrders: 1 },
          ],
        },
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));

      presenter.init();

      expect(presenter.trendSubtitle()).toBe('1 día comparado');
    });

    it('dado varios dias en un preset LAST_7_DAYS, deberia combinar el rango label con la cantidad', () => {
      const panel = PanelKiosqueroMother.crear({
        trends: {
          lastSevenDays: [
            { date: '2026-06-14', totalSold: 1, totalOrders: 1, deliveredOrders: 1 },
            { date: '2026-06-15', totalSold: 1, totalOrders: 1, deliveredOrders: 1 },
          ],
        },
      });
      servicioHomeKiosquero.getPanelByRange.and.returnValue(of(panel));
      presenter.initReportes();
      presenter.onReportRangePresetChange(givenSelectEvent('LAST_7_DAYS'));

      expect(presenter.trendSubtitle()).toContain('Última semana');
      expect(presenter.trendSubtitle()).toContain('2 días comparados');
    });
  });

  describe('computeds con panel vacio/null — cubren los ?? 0 y ?? []', () => {
    beforeEach(() => {
      servicioHomeKiosquero.getPanel.and.returnValue(of(null as unknown as PanelKiosquero));
      presenter.init();
    });

    it('sin panel, los computeds simples deberian devolver 0 y strings monetarios en 0', () => {
      expect(presenter.ventasHoy()).toBe(0);
      expect(presenter.productosSinStock()).toBe(0);
      expect(presenter.gananciasFormateadas()).toContain('0');
    });

    it('sin panel, summaryMetrics deberia devolver los 6 metrics con valores 0 y sin tone en pending/soldOut', () => {
      const metrics = presenter.summaryMetrics();
      const preparar = metrics.find((m) => m.label === 'A preparar');
      const sinStock = metrics.find((m) => m.label === 'Sin stock');

      expect(metrics.length).toBe(6);
      expect(preparar?.tone).toBeUndefined();
      expect(sinStock?.tone).toBeUndefined();
    });

    it('sin panel, mainSummaryMetrics deberia mostrar "0 / 0" en entregados', () => {
      const metric = presenter.mainSummaryMetrics().find((m) => m.label === 'Entregados');

      expect(metric?.value).toBe('0 / 0');
    });

    it('sin panel, reportSummaryMetrics deberia devolver 4 metrics con valores 0', () => {
      const metrics = presenter.reportSummaryMetrics();

      expect(metrics.length).toBe(4);
      expect(metrics[0].value).toContain('0');
    });

    it('sin panel, operationalCards deberia usar los "success" tones (todos en 0)', () => {
      const cards = presenter.operationalCards();

      expect(cards.length).toBe(3);
      expect(cards.every((c) => c.tone === 'success')).toBeTrue();
    });

    it('sin panel, alertMetrics deberia devolver 6 metrics con valores 0', () => {
      const metrics = presenter.alertMetrics();

      expect(metrics.length).toBe(6);
      expect(metrics.every((m) => m.value.includes('0'))).toBeTrue();
    });

    it('sin panel, stockOverview deberia devolver "success" en ambos tones (0 agotados, 0 bajo stock)', () => {
      const overview = presenter.stockOverview();

      expect(overview.map((m) => m.tone)).toEqual(['success', 'success']);
    });

    it('sin panel, salesByTimeSlot y salesByCategory deberian devolver []', () => {
      expect(presenter.salesByTimeSlot()).toEqual([]);
      expect(presenter.salesByCategory()).toEqual([]);
    });

    it('sin panel, ordersByStatus y orderedStatusItems deberian caer a arrays vacios/relenados con orders=0', () => {
      expect(presenter.ordersByStatus()).toEqual([]);
      expect(presenter.orderedStatusItems().length).toBe(7);
      expect(presenter.orderedStatusItems().every((s) => s.orders === 0)).toBeTrue();
    });

    it('sin panel, ordersByPurchaseType deberia devolver []', () => {
      expect(presenter.ordersByPurchaseType()).toEqual([]);
    });

    it('sin panel, productGroups deberia devolver los 4 grupos con items vacios', () => {
      const groups = presenter.productGroups();

      expect(groups.length).toBe(4);
      expect(groups.every((g) => g.items.length === 0)).toBeTrue();
    });

    it('sin panel, rankingProductGroups deberia devolver los 2 grupos vacios', () => {
      expect(presenter.rankingProductGroups().length).toBe(2);
    });

    it('sin panel, alertItems deberia devolver []', () => {
      expect(presenter.alertItems()).toEqual([]);
    });

    it('sin panel, trendDays y selectedTrendDay deberian devolver [] y null', () => {
      expect(presenter.trendDays()).toEqual([]);
      expect(presenter.selectedTrendDay()).toBeNull();
      expect(presenter.bestTrendDay()).toBeNull();
    });

    it('sin panel, selectedTrendBreakdown deberia devolver []', () => {
      expect(presenter.selectedTrendBreakdown()).toEqual([]);
    });

    it('sin panel, hasVisibleAlerts y hasReportAlerts deberian ser false', () => {
      expect(presenter.hasVisibleAlerts()).toBeFalse();
      expect(presenter.hasReportAlerts()).toBeFalse();
    });

    it('sin panel, criticalProductGroups deberia estar vacio y hasCriticalStock false', () => {
      expect(presenter.criticalProductGroups()).toEqual([]);
      expect(presenter.hasCriticalStock()).toBeFalse();
    });
  });

  describe('helpers de labels con codigos desconocidos', () => {
    it('formatPurchaseType con un tipo desconocido deberia devolver el mismo codigo', () => {
      const purchaseType = 'RARO' as unknown as import('../models/panel-kiosquero.model').KiosqueroPurchaseType;
      const label = (presenter as unknown as { formatPurchaseType(t: unknown): string }).formatPurchaseType(purchaseType);

      expect(label).toBe('RARO');
    });

    it('formatInventoryStatus con estado desconocido deberia devolver el mismo codigo', () => {
      const status = 'RARO' as unknown as import('../models/panel-kiosquero.model').KiosqueroInventoryStatus;
      const label = (presenter as unknown as { formatInventoryStatus(s: unknown): string }).formatInventoryStatus(status);

      expect(label).toBe('RARO');
    });

    it('formatMoney y formatNumber con undefined deberian usar 0 como fallback', () => {
      const priv = presenter as unknown as { formatMoney(v?: number): string; formatNumber(v?: number): string };

      expect(priv.formatMoney(undefined)).toContain('0');
      expect(priv.formatNumber(undefined)).toContain('0');
    });

    it('calculatePercent con total 0 o undefined deberia devolver 0', () => {
      const priv = presenter as unknown as { calculatePercent(v: number, t: number | undefined): number };

      expect(priv.calculatePercent(10, 0)).toBe(0);
      expect(priv.calculatePercent(10, undefined)).toBe(0);
    });
  });

  describe('bestTrendDay y selectedTrendDay con multiples dias', () => {
    it('dado varios dias con distintas ventas, bestTrendDay deberia devolver el de mayor totalSold', fakeAsync(() => {
      const panel = PanelKiosqueroMother.crear({
        trends: {
          lastSevenDays: [
            { date: '2026-06-14', totalSold: 100, totalOrders: 1, deliveredOrders: 1 },
            { date: '2026-06-15', totalSold: 500, totalOrders: 3, deliveredOrders: 3 },
            { date: '2026-06-16', totalSold: 300, totalOrders: 2, deliveredOrders: 2 },
          ],
        },
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));
      presenter.init();
      tick();

      expect(presenter.bestTrendDay()?.date).toBe('2026-06-15');
    }));

    it('dado selectedTrendDate que no matchea, selectedTrendDay deberia caer al ultimo dia', fakeAsync(() => {
      const panel = PanelKiosqueroMother.crear({
        trends: {
          lastSevenDays: [
            { date: '2026-06-14', totalSold: 100, totalOrders: 1, deliveredOrders: 1 },
            { date: '2026-06-15', totalSold: 500, totalOrders: 3, deliveredOrders: 3 },
          ],
        },
      });
      servicioHomeKiosquero.getPanel.and.returnValue(of(panel));
      presenter.init();
      tick();

      presenter.selectTrendDay('2999-01-01');

      expect(presenter.selectedTrendDay()?.date).toBe('2026-06-15');
    }));
  });

  describe('primaryAction', () => {
    it('dado que no hay ver-pedidos en acciones (forzado), primaryAction deberia devolver null', () => {
      const original = presenter.acciones;
      const nuevoComputed = Object.defineProperty(presenter, 'acciones', {
        value: () => [],
        configurable: true,
      });

      expect(presenter.primaryAction()).toBeNull();

      Object.defineProperty(presenter, 'acciones', { value: original, configurable: true });
      expect(nuevoComputed).toBeDefined();
    });
  });

  function countInclusiveDays(from: string, to: string): number {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    const toTime = new Date(`${to}T00:00:00`).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((toTime - fromTime) / dayMs) + 1;
  }

  function addDaysToInputDate(value: string, days: number): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, (month ?? 1) - 1, day ?? 1);
    date.setDate(date.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function givenInputEvent(value: string): Event {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    return { target: input } as unknown as Event;
  }

  function givenSelectEvent(value: string): Event {
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = value;
    select.appendChild(option);
    select.value = value;
    return { target: select } as unknown as Event;
  }

  function crearEventoRealtime(override: Partial<EventoInventarioRealtime> = {}): EventoInventarioRealtime {
    return {
      buffetId: BUFFET_ID_TEST,
      type: 'DASHBOARD_CHANGED',
      occurredAt: '2026-06-11T10:00:00Z',
      ...override,
    };
  }
});
