import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PanelKiosquero } from '../models/panel-kiosquero.model';
import { HomeKiosqueroService } from '../services/home-kiosquero.service';
import { InventarioRealtimeService } from '../../inventario/services/inventario-realtime.service';
import { HomeKiosqueroPresenter } from './home-kiosquero.presenter';

describe('HomeKiosqueroPresenter', () => {
  let presenter: HomeKiosqueroPresenter;
  let homeKiosqueroService: jasmine.SpyObj<HomeKiosqueroService>;
  let inventoryRealtimeService: jasmine.SpyObj<InventarioRealtimeService>;
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
      topSoldProducts: [
        {
          productId: 'top-1',
          productName: 'Medialuna',
          urlImagen: 'medialuna.jpg',
          quantity: 5,
          total: 7500,
        },
      ],
      mostReservedProducts: [
        {
          productId: 'reserved-1',
          productName: 'Sandwich',
          urlImagen: null,
          quantity: 3,
          total: 9000,
        },
      ],
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
      items: [
        {
          type: 'EXPIRED',
          label: 'Pedidos vencidos',
          quantity: 1,
          amount: 0,
        },
        {
          type: 'REFUND',
          label: 'Creditos devueltos',
          quantity: 0,
          amount: 1250,
        },
        {
          type: 'EMPTY',
          label: 'Sin impacto',
          quantity: 0,
          amount: 0,
        },
      ],
    },
    trends: {
      lastSevenDays: [
        {
          date: '2026-06-10',
          totalSold: 1000,
          totalOrders: 2,
          deliveredOrders: 2,
        },
        {
          date: '2026-06-11',
          totalSold: 4000,
          totalOrders: 4,
          deliveredOrders: 3,
          expiredOrders: 1,
        },
      ],
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
    inventoryRealtimeService = jasmine.createSpyObj<InventarioRealtimeService>(
      'InventarioRealtimeService',
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
        { provide: InventarioRealtimeService, useValue: inventoryRealtimeService },
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

  it('expone metricas de resumen y atencion', () => {
    expect(
      presenter.summaryMetrics().map((metric) => [
        metric.label,
        metric.tone,
      ]),
    ).toEqual([
      ['Total vendido', 'success'],
      ['Pedidos totales', undefined],
      ['Entregados', 'success'],
      ['Venta promedio', undefined],
      ['A preparar', 'warning'],
      ['Sin stock', 'danger'],
    ]);

    expect(presenter.mainSummaryMetrics().map((metric) => metric.label)).toEqual(
      ['Total vendido hoy', 'Pedidos totales', 'Entregados'],
    );
    expect(
      presenter.reportSummaryMetrics().map((metric) => metric.label),
    ).toEqual([
      'Total vendido',
      'Pedidos totales',
      'Entregados',
      'Venta promedio',
    ]);
    expect(presenter.attentionItems().map((item) => item.label)).toEqual([
      'A preparar',
      'Ya listos',
      'Vencidos',
    ]);
    expect(presenter.hasPanelData()).toBeTrue();
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
      'tracking-pedidos',
      'cargar-productos',
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

  it('ordena ventas por recreo por horario y deja compras espontaneas al final', () => {
    const slots = presenter.salesByTimeSlot();

    expect(slots.map((slot) => slot.timeSlot)).toEqual([
      'Primer recreo',
      'Compra espontanea',
    ]);
    expect(slots[0].timeRangeLabel).toBe('09:30 - 09:45');
    expect(slots[0].percent).toBe(60);
    expect(slots[1].timeRangeLabel).toBeNull();
    expect(slots[1].percent).toBe(100);
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

  it('completa estados operativos y grupos de productos', () => {
    expect(presenter.ordersByStatus().map((status) => status.status)).toEqual([
      'EN_PREPARACION',
      'LISTO',
    ]);
    expect(
      presenter.orderedStatusItems().map((status) => [
        status.status,
        status.orders,
      ]),
    ).toEqual([
      ['PENDIENTE', 0],
      ['EN_PREPARACION', 2],
      ['LISTO', 3],
      ['ENTREGADO', 0],
      ['CANCELADO', 0],
      ['RECHAZADO', 0],
      ['VENCIDO', 0],
    ]);

    expect(presenter.productGroups().map((group) => group.title)).toEqual([
      'Más vendidos',
      'Más reservados ahora',
      'Reposición',
      'Agotados',
    ]);
    expect(presenter.productGroups()[0].items[0]).toEqual(
      jasmine.objectContaining({
        id: 'top-1',
        label: 'Medialuna',
        detail: '5 unidades',
      }),
    );
    expect(presenter.rankingProductGroups().map((group) => group.title)).toEqual(
      ['Más vendidos', 'Más reservados ahora'],
    );
    expect(presenter.hasCriticalStock()).toBeTrue();
    expect(presenter.primaryAction()?.id).toBe('ver-pedidos');
  });

  it('expone alertas visibles y metricas de reporte', () => {
    const alertLabels = presenter.alertMetrics().map((metric) => metric.label);
    const visibleAlertLabels = presenter
      .visibleAlertMetrics()
      .map((metric) => metric.label);

    expect(alertLabels.length).toBe(6);
    expect(alertLabels).toContain('Pedidos vencidos');
    expect(alertLabels).toContain('A preparar');
    expect(visibleAlertLabels.length).toBe(4);
    expect(visibleAlertLabels).toContain('Pedidos vencidos');
    expect(visibleAlertLabels).toContain('A preparar');
    expect(presenter.reportAlertMetrics().length).toBe(4);
    expect(presenter.alertItems().map((item) => item.quantityLabel)).toEqual([
      '1',
      '0',
      '0',
    ]);
    expect(
      presenter.visibleAlertItems().map((item) => [item.type, item.amountLabel]),
    ).toEqual([
      ['EXPIRED', jasmine.any(String)],
      ['REFUND', jasmine.any(String)],
    ]);
    expect(presenter.hasVisibleAlerts()).toBeTrue();
    expect(presenter.hasReportAlerts()).toBeTrue();
  });

  it('actualiza fecha, rango y seleccion de tendencia desde handlers publicos', () => {
    const initialPanelCalls = homeKiosqueroService.getPanel.calls.count();
    const initialRangeCalls = homeKiosqueroService.getPanelByRange.calls.count();

    presenter.onDateChange({
      target: { value: '2026-06-12' },
    } as unknown as Event);
    presenter.refrescarPanel();

    expect(presenter.selectedDate()).toBe('2026-06-12');
    expect(homeKiosqueroService.getPanel.calls.count()).toBe(
      initialPanelCalls + 2,
    );

    presenter.onReportRangePresetChange({
      target: { value: 'LAST_7_DAYS' },
    } as unknown as Event);
    presenter.onReportRangeFromChange({
      target: { value: '2026-06-01' },
    } as unknown as Event);
    presenter.onReportRangeToChange({
      target: { value: '2026-06-15' },
    } as unknown as Event);
    presenter.refrescarReportes();
    presenter.selectTrendDay('2026-06-10');

    expect(presenter.selectedRangePreset()).toBe('CUSTOM');
    expect(presenter.reportRangeFrom()).toBe('2026-06-01');
    expect(presenter.reportRangeTo()).toBe('2026-06-15');
    expect(homeKiosqueroService.getPanelByRange.calls.count()).toBeGreaterThan(
      initialRangeCalls,
    );
    expect(presenter.selectedTrendDay()?.date).toBe('2026-06-10');
  });

  it('ignora cambios invalidos de fecha y rango', () => {
    const panelCalls = homeKiosqueroService.getPanel.calls.count();
    const rangeCalls = homeKiosqueroService.getPanelByRange.calls.count();

    presenter.onDateChange({ target: { value: '' } } as unknown as Event);
    presenter.onDateChange({
      target: { value: presenter.selectedDate() },
    } as unknown as Event);
    presenter.onReportRangePresetChange({
      target: { value: 'INVALIDO' },
    } as unknown as Event);
    presenter.onReportRangeFromChange({
      target: { value: presenter.reportRangeFrom() },
    } as unknown as Event);
    presenter.onReportRangeToChange({
      target: { value: presenter.reportRangeTo() },
    } as unknown as Event);

    expect(homeKiosqueroService.getPanel.calls.count()).toBe(panelCalls);
    expect(homeKiosqueroService.getPanelByRange.calls.count()).toBe(rangeCalls);
  });

  it('devuelve claves de tracking para listas del template', () => {
    expect(presenter.trackMetric(0, presenter.summaryMetrics()[0])).toBe(
      'Total vendido',
    );
    expect(presenter.trackAttentionItem(0, presenter.attentionItems()[0])).toBe(
      'A preparar',
    );
    expect(presenter.trackTimeSlot(0, presenter.salesByTimeSlot()[0])).toBe(
      'slot-1',
    );
    expect(presenter.trackStatus(0, presenter.orderedStatusItems()[0])).toBe(
      'PENDIENTE',
    );
    expect(
      presenter.trackPurchaseType(0, presenter.ordersByPurchaseType()[0]),
    ).toBe('PRESENCIAL');
    expect(presenter.trackProductGroup(0, presenter.productGroups()[0])).toBe(
      'Más vendidos',
    );
    expect(
      presenter.trackProductItem(0, presenter.productGroups()[0].items[0]),
    ).toBe('top-1');
    expect(presenter.trackAlertItem(0, presenter.alertItems()[0])).toBe(
      'EXPIRED',
    );
    expect(presenter.trackTrendDay(0, presenter.trendDays()[0])).toBe(
      '2026-06-10',
    );
  });

  it('refresca el panel con debounce cuando llega DASHBOARD_CHANGED', fakeAsync(() => {
    const originalVisibility = document.visibilityState;
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });

    const handlers = inventoryRealtimeService.connect.calls.mostRecent()
      .args[1] as {
      onRefresh: (event: { type: string; buffetId: string; occurredAt: string }) => void;
    };
    const initialCalls = homeKiosqueroService.getPanel.calls.count();

    handlers.onRefresh({
      type: 'DASHBOARD_CHANGED',
      buffetId: 'buffet-1',
      occurredAt: new Date().toISOString(),
    });
    tick(2499);
    expect(homeKiosqueroService.getPanel.calls.count()).toBe(initialCalls);

    tick(1);
    expect(inventoryRealtimeService.recordRefetch).toHaveBeenCalledWith(
      'home-kiosquero-panel',
    );
    expect(homeKiosqueroService.getPanel.calls.count()).toBe(initialCalls + 1);

    Object.defineProperty(document, 'visibilityState', { value: originalVisibility, configurable: true });
  }));

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

  describe('Cobertura de Ramas y Casos Extremos (Branch Coverage)', () => {
    it('maneja inicialización sin buffetId', () => {
      (presenter as any).perfilService.obtenerBuffetId.and.returnValue(null);
      presenter.init();
      expect(presenter.errorMessage()).toBe('No se encontró un buffet asociado a tu perfil.');
      presenter.initReportes();
      expect(presenter.errorMessage()).toBe('No se encontró un buffet asociado a tu perfil.');
    });

    it('maneja perfil nulo o incompleto para el kiosquero', () => {
      (presenter as any).perfilService.getPerfil.and.returnValue(null);
      (presenter as any).homeKiosqueroService.getNombreKiosquero.and.returnValue('Test User');
      presenter.init();
      expect(presenter.nombreKiosquero()).toBe('Test User');
      expect(presenter.urlFotoPerfil()).toBeNull();
      expect(presenter.iniciales()).toBe('TU');
    });

    it('calcula saludo y saludo inicial según la hora y nombre', () => {
      // Test iniciales only, since saludo uses new Date() which is not reactive in the signal
      (presenter as any).nombreKiosqueroState.set('A');
      expect(presenter.iniciales()).toBe('A');

      (presenter as any).nombreKiosqueroState.set('A B C');
      expect(presenter.iniciales()).toBe('AB');
    });

    it('maneja errores en cargarPanel y cargarPanelReportes', () => {
      (presenter as any).homeKiosqueroService.getPanel.and.returnValue(throwError(() => new Error('Error')));
      presenter.refrescarPanel();
      expect(presenter.errorMessage()).toBe('No se pudo cargar el estado del buffet.');

      (presenter as any).homeKiosqueroService.getPanelByRange.and.returnValue(throwError(() => new Error('Error')));
      presenter.refrescarReportes();
      expect(presenter.errorMessage()).toBe('No se pudo cargar el dashboard del período.');
    });

    it('maneja valores nulos en el estado del panel para todos los selectores', () => {
      (presenter as any).panelState.set(null);
      expect(presenter.summaryMetrics().length).toBe(6);
      expect(presenter.mainSummaryMetrics().length).toBe(3);
      expect(presenter.reportSummaryMetrics().length).toBe(4);
      expect(presenter.operationalCards().length).toBe(3);
      expect(presenter.attentionItems().length).toBe(3);
      expect(presenter.salesByTimeSlot().length).toBe(0);
      expect(presenter.salesByCategory().length).toBe(0);
      expect(presenter.ordersByStatus().length).toBe(0);
      expect(presenter.orderedStatusItems().length).toBe(7);
      expect(presenter.ordersByPurchaseType().length).toBe(0);
      expect(presenter.productGroups().length).toBe(4);
      expect(presenter.criticalProductGroups().length).toBe(0);
      expect(presenter.stockOverview().length).toBe(2);
      expect(presenter.rankingProductGroups().length).toBe(2);
      expect(presenter.alertMetrics().length).toBe(6);
      expect(presenter.visibleAlertMetrics().length).toBe(0);
      expect(presenter.alertItems().length).toBe(0);
      expect(presenter.visibleAlertItems().length).toBe(0);
      expect(presenter.hasVisibleAlerts()).toBeFalse();
      expect(presenter.trendDays().length).toBe(0);
      expect(presenter.selectedTrendDay()).toBeNull();
      expect(presenter.selectedTrendBreakdown().length).toBe(0);
    });

    it('prueba metodos auxiliares de formato (formatDate, formatClockTime, calculatePercent)', () => {
      expect((presenter as any).formatDate(null)).toBe('-');
      expect((presenter as any).formatDate('invalida')).toBe('invalida');
      expect((presenter as any).formatShortDate('invalida')).toBe('invalida');
      expect((presenter as any).formatTimeRange(null, null)).toBeNull();
      expect((presenter as any).formatClockTime('invalida')).toBe('invalida');
      expect((presenter as any).calculatePercent(10, 0)).toBe(0);
      expect((presenter as any).formatPurchaseType('NUEVO_TIPO' as any)).toBe('NUEVO_TIPO');
      expect((presenter as any).formatInventoryStatus('NUEVO_ESTADO' as any)).toBe('NUEVO_ESTADO');
    });

    it('maneja compareTimeSlots con tiempos mixtos y nulos', () => {
      const t1 = { timeSlot: 'A', pickupSlotStartTime: null } as any;
      const t2 = { timeSlot: 'B', pickupSlotStartTime: null } as any;
      const t3 = { timeSlot: 'C', pickupSlotStartTime: '10:00:00' } as any;
      const t4 = { timeSlot: 'D', pickupSlotStartTime: '09:00:00' } as any;

      expect((presenter as any).compareTimeSlots(t1, t2)).toBe(-1); // A vs B
      expect((presenter as any).compareTimeSlots(t2, t1)).toBe(1); // B vs A
      expect((presenter as any).compareTimeSlots(t1, t3)).toBe(1);  // nulo vs con tiempo
      expect((presenter as any).compareTimeSlots(t3, t1)).toBe(-1); // con tiempo vs nulo
      expect((presenter as any).compareTimeSlots(t4, t3)).toBe(-1); // 09:00 vs 10:00
    });

    it('isReportRangeValid retorna false en rangos invalidos o muy largos', () => {
      expect((presenter as any).isReportRangeValid({from: null, to: null})).toBeFalse();
      expect((presenter as any).isReportRangeValid({from: '2026-06-10', to: '2026-06-01'})).toBeFalse();
      // Un año + 2 días
      expect((presenter as any).isReportRangeValid({from: '2025-01-01', to: '2026-01-05'})).toBeFalse();
    });

    it('prueba validacion de eventos realtime (shouldRefreshPanelForRealtimeEvent)', () => {
      const originalVisibility = document.visibilityState;
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      
      const realEvent = { type: 'DASHBOARD_CHANGED', buffetId: 'buffet-1', date: presenter.selectedDate() } as any;
      expect((presenter as any).isRealtimeEventForCurrentPanel(realEvent)).toBeTrue();
      
      const unhandledEvent = { type: 'OTRO_EVENTO', buffetId: 'buffet-1', date: presenter.selectedDate() } as any;
      expect((presenter as any).shouldRefreshPanelForRealtimeEvent(unhandledEvent)).toBeFalse();
      
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      expect((presenter as any).shouldRefreshPanelForRealtimeEvent(realEvent)).toBeFalse();
      Object.defineProperty(document, 'visibilityState', { value: originalVisibility, configurable: true });
    });

    it('maneja states vacios/ceros para metrics operativas', () => {
      const panelZ = {
        summary: { pendingOrders: 0, soldOutProducts: 0, totalOrders: 0, totalSold: 0 },
        alerts: { pendingOrders: 0, readyOrders: 0, expiredOrders: 0, soldOutEvents: 0 },
        products: { productsNeedingRestock: [], soldOutProducts: [] },
        activity: { salesByCategory: [{ categoryId: '1', quantity: 0, total: 0 }], ordersByPurchaseType: [{ type: 'PRESENCIAL', orders: 0 }] }
      } as any;
      (presenter as any).panelState.set(panelZ);
      
      expect(presenter.operationalCards()[0].tone).toBe('success');
      expect(presenter.stockOverview()[0].tone).toBe('success');
      expect(presenter.alertMetrics().every(m => m.tone !== 'warning' && m.tone !== 'danger')).toBeTrue();
      expect(presenter.salesByCategory()[0].totalPercent).toBe(0);
      expect(presenter.ordersByPurchaseType()[0].percent).toBe(0);
    });

    it('maneja breakdown de trends con valores cero', () => {
      const reportPanelZero = {
        trends: {
          lastSevenDays: [
            { date: '2026-06-14', totalSold: 0, totalOrders: 0, deliveredOrders: 0, createdOrders: 0, pendingOrders: 0, inPreparationOrders: 0, readyOrders: 0, cancelledOrders: 0, rejectedOrders: 0, expiredOrders: 0 }
          ]
        }
      } as any;
      (presenter as any).selectedRangePresetState.set('LAST_7_DAYS');
      (presenter as any).panelState.set(reportPanelZero);
      (presenter as any).selectedTrendDateState.set('2026-06-14');
      
      const day = presenter.selectedTrendDay();
      expect(day?.createdOrdersLabel).toBe('0 pedidos hechos');
      const breakdown = presenter.selectedTrendBreakdown();
      expect(breakdown[0].tone).toBe('success'); // createdOrders not > deliveredOrders
    });

    it('maneja onDateChange y report ranges invalidos / mismos valores', () => {
      (presenter as any).selectedDateState.set('2026-06-11');
      presenter.onDateChange({ target: { value: '2026-06-11' } } as any); // Same date
      presenter.onDateChange({ target: { value: null } } as any); // Null
      expect(presenter.selectedDate()).toBe('2026-06-11');
      
      (presenter as any).reportRangeFromState.set('2026-06-01');
      presenter.onReportRangeFromChange({ target: { value: '2026-06-01' } } as any);
      expect(presenter.reportRangeFrom()).toBe('2026-06-01');

      (presenter as any).reportRangeToState.set('2026-06-15');
      presenter.onReportRangeToChange({ target: { value: '2026-06-15' } } as any);
      expect(presenter.reportRangeTo()).toBe('2026-06-15');
    });

    it('prueba el subtitulo de trendSubtitle para varios dias y CUSTOM', () => {
      (presenter as any).selectedRangePresetState.set('CUSTOM');
      (presenter as any).reportRangeFromState.set('2026-06-01');
      (presenter as any).reportRangeToState.set('2026-06-02');
      // Set panel data with 2 trend days
      (presenter as any).panelState.set({
        trends: {
          lastSevenDays: [
            { date: '2026-06-01', totalSold: 0 },
            { date: '2026-06-02', totalSold: 0 }
          ]
        }
      } as any);
      
      expect(presenter.trendSubtitle()).toBe('01/06/2026 al 02/06/2026 · 2 días comparados');
    });
    
    it('ignora preset inválido', () => {
      (presenter as any).selectedRangePresetState.set('TODAY');
      presenter.onReportRangePresetChange({ target: { value: 'INVALIDE_PRESET' } } as any);
      expect(presenter.selectedRangePreset()).toBe('TODAY');
    });
    
    it('filtra correctly en reportAlertMetrics cuando hay alertas no nulas', () => {
      const panelA = {
        alerts: {
          expiredOrders: 1,
          items: [
            { type: 'EXPIRED', quantity: 0, amount: 0 },
            { type: 'REFUND', quantity: 1, amount: 0 }
          ]
        }
      } as any;
      (presenter as any).panelState.set(panelA);
      expect(presenter.hasReportAlerts()).toBeTrue(); 
    });

    it('isRealtimeEventForReportRange devuelve true/false según rango', () => {
      (presenter as any).reportRangeFromState.set('2026-06-01');
      (presenter as any).reportRangeToState.set('2026-06-10');
      expect((presenter as any).isRealtimeEventForReportRange({ date: '2026-06-05' })).toBeTrue();
      expect((presenter as any).isRealtimeEventForReportRange({ date: '2026-05-30' })).toBeFalse();
    });
  });

  function countInclusiveDays(from: string, to: string): number {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    const toTime = new Date(`${to}T00:00:00`).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    return Math.floor((toTime - fromTime) / dayMs) + 1;
  }
});
