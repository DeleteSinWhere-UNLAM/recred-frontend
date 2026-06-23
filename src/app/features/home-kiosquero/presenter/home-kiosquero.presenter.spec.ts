import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PanelKiosquero } from '../models/panel-kiosquero.model';
import { HomeKiosqueroService } from '../services/home-kiosquero.service';
import { InventoryRealtimeService } from '../../updated-inventory/services/inventory-realtime.service';
import { HomeKiosqueroPresenter } from './home-kiosquero.presenter';

describe('HomeKiosqueroPresenter', () => {
  let presenter: HomeKiosqueroPresenter;
  let homeKiosqueroService: jasmine.SpyObj<HomeKiosqueroService>;
  let inventoryRealtimeService: jasmine.SpyObj<InventoryRealtimeService>;
  let router: jasmine.SpyObj<Router>;

  const panel: PanelKiosquero = {
    buffetId: 'buffet-1',
    date: '2026-06-11',
    summary: {
      totalSold: 28500,
      totalOrders: 12,
      deliveredOrders: 7,
      averageTicket: 4071,
      pendingOrders: 4,
      soldOutProducts: 7,
    },
    activity: {
      salesByTimeSlot: [
        {
          pickupSlotId: null,
          timeSlot: 'Compra espontanea',
          pickupSlotStartTime: null,
          pickupSlotEndTime: null,
          orders: 2,
          totalSold: 5000,
        },
        {
          pickupSlotId: 'slot-1',
          timeSlot: 'Primer recreo',
          pickupSlotStartTime: '09:30:00',
          pickupSlotEndTime: '09:45:00',
          orders: 3,
          totalSold: 3000,
        },
      ],
      salesByCategory: [
        {
          categoryId: 'cat-1',
          categoryName: 'Golosinas',
          quantity: 8,
          total: 12000,
        },
        {
          categoryId: null,
          categoryName: 'Sin categoria',
          quantity: 4,
          total: 6000,
        },
      ],
      ordersByStatus: [
        {
          status: 'EN_PREPARACION',
          label: 'En preparación',
          orders: 2,
        },
        {
          status: 'LISTO',
          label: 'Listo para retirar',
          orders: 3,
        },
      ],
      ordersByPurchaseType: [
        {
          type: 'PRESENCIAL',
          orders: 8,
        },
        {
          type: 'ANTICIPADA',
          orders: 4,
        },
      ],
    },
    products: {
      topSoldProducts: [],
      mostReservedProducts: [],
      productsNeedingRestock: [
        {
          productId: 'low-1',
          productName: 'Alfajor',
          stockDisponible: 2,
          stockMinimo: 5,
          estadoInventario: 'BAJO_STOCK',
        },
        {
          productId: 'sold-out-1',
          productName: 'Jugo',
          stockDisponible: 0,
          stockMinimo: 4,
          estadoInventario: 'SIN_STOCK',
        },
      ],
      soldOutProducts: [
        {
          productId: 'sold-out-1',
          productName: 'Jugo',
          stockDisponible: 0,
          stockMinimo: 4,
          estadoInventario: 'SIN_STOCK',
        },
      ],
    },
    alerts: {
      expiredOrders: 1,
      releasedReservations: 0,
      refundedCredits: 0,
      soldOutEvents: 50,
      pendingOrders: 99,
      readyOrders: 3,
      items: [],
    },
    trends: {
      lastSevenDays: [],
    },
  };

  beforeEach(() => {
    const perfilService = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
      'obtenerBuffetId',
    ]);
    const usuarioService = jasmine.createSpyObj<UsuarioService>(
      'UsuarioService',
      ['setNombreNavbar'],
    );

    homeKiosqueroService = jasmine.createSpyObj<HomeKiosqueroService>(
      'HomeKiosqueroService',
      ['getPanel', 'getPanelByRange', 'getNombreKiosquero'],
    );
    inventoryRealtimeService = jasmine.createSpyObj<InventoryRealtimeService>(
      'InventoryRealtimeService',
      ['connect', 'recordRefetch'],
    );
    router = jasmine.createSpyObj<Router>('Router', [
      'navigate',
      'navigateByUrl',
    ]);

    perfilService.getPerfil.and.returnValue({
      id: 'perfil-1',
      nombre: 'Ana',
      apellido: 'Perez',
      email: 'ana@test.com',
      rol: 'VENDEDOR',
      buffetId: 'buffet-1',
    });
    perfilService.obtenerBuffetId.and.returnValue('buffet-1');
    homeKiosqueroService.getNombreKiosquero.and.returnValue('Carlos');
    homeKiosqueroService.getPanel.and.returnValue(of(panel));
    homeKiosqueroService.getPanelByRange.and.returnValue(of(panel));
    inventoryRealtimeService.connect.and.returnValue(new AbortController());

    TestBed.configureTestingModule({
      providers: [
        HomeKiosqueroPresenter,
        { provide: PerfilService, useValue: perfilService },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: HomeKiosqueroService, useValue: homeKiosqueroService },
        { provide: InventoryRealtimeService, useValue: inventoryRealtimeService },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(HomeKiosqueroPresenter);
    presenter.init();
  });

  it('arma las cards operativas con las fuentes correctas', () => {
    const cards = presenter.operationalCards();

    expect(cards.map((card) => [card.label, card.value])).toEqual([
      ['A preparar', '4'],
      ['Ya listos', '3'],
      ['Vencidos', '1'],
    ]);
  });

  it('se suscribe a realtime del buffet al iniciar', () => {
    expect(inventoryRealtimeService.connect).toHaveBeenCalledWith(
      'buffet-1',
      jasmine.objectContaining({
        onRefresh: jasmine.any(Function),
        onError: jasmine.any(Function),
      }),
    );
  });

  it('inicia reportes consultando el dashboard por rango de últimos 7 días', () => {
    presenter.initReportes();

    const [metricsBuffetId, metricsRange] =
      homeKiosqueroService.getPanelByRange.calls.argsFor(0);
    const [trendBuffetId, trendRange] =
      homeKiosqueroService.getPanelByRange.calls.argsFor(1);

    expect(metricsBuffetId).toBe('buffet-1');
    expect(metricsRange.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(metricsRange.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(countInclusiveDays(metricsRange.from, metricsRange.to)).toBe(1);
    expect(metricsRange.from).toBe(metricsRange.to);

    expect(trendBuffetId).toBe('buffet-1');
    expect(countInclusiveDays(trendRange.from, trendRange.to)).toBe(7);
  });

  it('usa salesByDay para la tendencia y expone el desglose de estados', () => {
    const reportPanel: PanelKiosquero = {
      ...panel,
      trends: {
        lastSevenDays: [
          {
            date: '2026-06-01',
            totalSold: 1,
            totalOrders: 1,
            deliveredOrders: 1,
          },
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
    };
    homeKiosqueroService.getPanelByRange.and.returnValue(of(reportPanel));

    presenter.initReportes();

    const day = presenter.trendDays()[0];
    const breakdown = presenter.selectedTrendBreakdown();

    expect(day.date).toBe('2026-06-14');
    expect(day.createdOrdersLabel).toBe('7 pedidos hechos');
    expect(day.deliveredOrdersLabel).toBe('3 entregados');
    expect(day.nonDeliveredOrdersLabel).toBe('4 no entregados');
    expect(
      breakdown.map((item) => [item.label, item.value, item.tone]),
    ).toContain(['Cancelados', '1', 'danger']);
    expect(
      breakdown.map((item) => [item.label, item.value, item.tone]),
    ).toContain(['Rechazados', '1', 'danger']);
  });

  it('usa summary para total sin stock y filtra bajo stock puro', () => {
    const stockOverview = presenter.stockOverview();
    const criticalGroups = presenter.criticalProductGroups();

    expect(stockOverview.map((metric) => [metric.label, metric.value])).toEqual(
      [
        ['Agotados', '7'],
        ['Bajo stock', '1'],
      ],
    );

    expect(criticalGroups[0].title).toBe('Productos sin stock');
    expect(criticalGroups[0].countLabel).toBe('7');
    expect(criticalGroups[0].items.map((item) => item.label)).toEqual(['Jugo']);

    expect(criticalGroups[1].title).toBe('Productos bajo stock');
    expect(criticalGroups[1].items.map((item) => item.label)).toEqual([
      'Alfajor',
    ]);
  });

  it('expone las acciones operativas esperadas', () => {
    expect(presenter.acciones().map((accion) => accion.id)).toEqual([
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
    ]);
    expect(presenter.featuredActions().map((accion) => accion.id)).toEqual([
      'venta-espontanea',
      'cargar-productos',
      'oportunidades-stock',
      'sugerencias',
      'cierre-diario',
    ]);
    expect(presenter.secondaryActions().map((accion) => accion.id)).toEqual([]);
  });

  it('formatea ventas por categoria con porcentaje de barra y porcentaje real', () => {
    const categories = presenter.salesByCategory();

    expect(categories.map((category) => category.categoryName)).toEqual([
      'Golosinas',
      'Sin categoria',
    ]);
    expect(categories[0].quantityLabel).toBe('8 unidades');
    expect(categories[0].totalLabel).toContain('12.000');
    expect(categories[0].barPercent).toBe(100);
    expect(categories[1].barPercent).toBe(50);
    expect(categories[0].totalPercent).toBe(42.1);
    expect(categories[0].totalPercentLabel).toBe('42,1%');
    expect(categories[1].totalPercent).toBe(21.1);
    expect(categories[1].totalPercentLabel).toBe('21,1%');
  });

  it('redistribuye visualmente compras espontaneas en franjas con horario', () => {
    const slots = presenter.salesByTimeSlot();

    expect(slots.map((slot) => slot.timeSlot)).toEqual(['Primer recreo']);
    expect(slots[0].timeRangeLabel).toBe('09:30 - 09:45');
    expect(slots[0].orders).toBe(5);
    expect(slots[0].ordersLabel).toBe('5 pedidos');
    expect(slots[0].totalSold).toBe(8000);
    expect(slots[0].totalSoldLabel).toBe('$ 8.000');
    expect(slots[0].percent).toBe(100);
  });

  it('formatea tipos de compra con cantidad sobre total y porcentaje', () => {
    const purchaseTypes = presenter.ordersByPurchaseType();

    expect(
      purchaseTypes.map((type) => [
        type.label,
        type.shareLabel,
        type.percentLabel,
      ]),
    ).toEqual([
      ['Presencial', '8 de 12 compras', '67%'],
      ['Anticipada', '4 de 12 compras', '33%'],
    ]);
  });

  it('navega a pedidos con fecha y estado preparados para filtro', () => {
    presenter.abrirPedidos('LISTO');

    expect(router.navigate).toHaveBeenCalledOnceWith(['/cierre-diario'], {
      queryParams: {
        date: presenter.selectedDate(),
        status: 'LISTO',
      },
    });
  });

  it('navega a inventario con el producto critico para reponer', () => {
    const criticalItem = presenter.criticalProductGroups()[0].items[0];

    presenter.reponerStock(criticalItem);

    expect(router.navigate).toHaveBeenCalledWith(['/admin-productos'], {
      queryParams: {
        productId: 'sold-out-1',
      },
    });
  });

  it('navega a la vista general de stock', () => {
    presenter.abrirStock();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
  });

  it('navega a reportes desde el acceso del encabezado', () => {
    presenter.abrirReportes();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/reportes');
  });

  it('navega a promociones desde la accion fusionada', () => {
    const promociones = presenter
      .acciones()
      .find((accion) => accion.id === 'promociones');

    expect(promociones).toBeDefined();

    presenter.ejecutarAccion(promociones!);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
  });

  function countInclusiveDays(from: string, to: string): number {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    const toTime = new Date(`${to}T00:00:00`).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    return Math.floor((toTime - fromTime) / dayMs) + 1;
  }
});
