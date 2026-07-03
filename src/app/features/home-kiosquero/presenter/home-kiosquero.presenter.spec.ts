import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PerfilMother } from '../../../data-access/services/alumno.mother';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { InventarioRealtimeService } from '../../inventario/services/inventario-realtime.service';
import {
  BUFFET_ID_TEST,
  PanelKiosqueroMother,
} from '../home-kiosquero.mother';
import { PanelKiosquero } from '../models/panel-kiosquero.model';
import { HomeKiosqueroService } from '../services/home-kiosquero.service';
import { HomeKiosqueroPresenter } from './home-kiosquero.presenter';

describe('HomeKiosqueroPresenter', () => {
  let presenter: HomeKiosqueroPresenter;
  let servicioHomeKiosquero: jasmine.SpyObj<HomeKiosqueroService>;
  let servicioRealtime: jasmine.SpyObj<InventarioRealtimeService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
      'obtenerBuffetId',
    ]);
    const servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
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
        'oportunidades-stock',
        'tracking-pedidos',
        'stock',
        'reportes',
        'sugerencias',
        'recomendaciones',
        'promociones',
        'cierre-diario',
        'proveedores',
      ]);
    });

    it('dado el presenter, deberia exponer las 5 acciones destacadas', () => {
      expect(presenter.featuredActions().map((a) => a.id)).toEqual([
        'venta-espontanea',
        'cargar-productos',
        'oportunidades-stock',
        'sugerencias',
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

  function countInclusiveDays(from: string, to: string): number {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    const toTime = new Date(`${to}T00:00:00`).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((toTime - fromTime) / dayMs) + 1;
  }
});
