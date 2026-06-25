import {
  DestroyRef,
  Injectable,
  NgZone,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { AccionKiosquero } from '../models/accion-kiosquero.model';
import {
  KiosqueroInventoryStatus,
  KiosqueroOrderStatus,
  KiosqueroPurchaseType,
  PanelKiosquero,
  PanelKiosqueroAlertItem,
  PanelKiosqueroCategorySale,
  PanelKiosqueroInventoryProduct,
  PanelKiosqueroOrdersByStatus,
  PanelKiosqueroProductTotal,
  PanelKiosqueroTimeSlotSale,
  PanelKiosqueroTrendDay,
} from '../models/panel-kiosquero.model';
import {
  DashboardRangeParams,
  HomeKiosqueroService,
} from '../services/home-kiosquero.service';
import { InventoryRealtimeService } from '../../updated-inventory/services/inventory-realtime.service';
import { RealtimeInventoryEvent } from '../../updated-inventory/models/inventory.interface';

type MetricTone = 'success' | 'warning' | 'danger';
type PanelMode = 'home' | 'reportes';
type ReportRangePreset =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_14_DAYS'
  | 'LAST_30_DAYS'
  | 'CUSTOM';

interface ReportRangeOption {
  id: ReportRangePreset;
  label: string;
}

interface PanelMetric {
  label: string;
  value: string;
  icon: string;
  tone?: MetricTone;
}

interface AttentionItem {
  label: string;
  value: string;
  icon: string;
  tone: MetricTone;
}

interface OperationalCard {
  label: string;
  value: string;
  icon: string;
  status: KiosqueroOrderStatus;
  helper: string;
  tone: MetricTone;
}

interface TimeSlotView extends PanelKiosqueroTimeSlotSale {
  ordersLabel: string;
  totalSoldLabel: string;
  timeRangeLabel: string | null;
  percent: number;
}

interface CategorySaleView extends PanelKiosqueroCategorySale {
  quantityLabel: string;
  totalLabel: string;
  barPercent: number;
  totalPercent: number;
  totalPercentLabel: string;
}

interface PurchaseTypeView {
  type: KiosqueroPurchaseType;
  label: string;
  ordersLabel: string;
  shareLabel: string;
  percentLabel: string;
  percent: number;
}

interface ProductListItem {
  id: string;
  label: string;
  detail: string;
  imageUrl?: string | null;
  amount?: string;
  tone?: MetricTone;
}

interface ProductGroup {
  title: string;
  icon: string;
  emptyLabel: string;
  items: ProductListItem[];
  countLabel?: string;
  tone?: MetricTone;
}

interface TrendDayView extends PanelKiosqueroTrendDay {
  dateLabel: string;
  totalSoldLabel: string;
  totalOrdersLabel: string;
  createdOrdersLabel: string;
  deliveredOrdersLabel: string;
  nonDeliveredOrdersLabel: string;
  pendingOrdersLabel: string;
  inPreparationOrdersLabel: string;
  readyOrdersLabel: string;
  cancelledOrdersLabel: string;
  rejectedOrdersLabel: string;
  expiredOrdersLabel: string;
  createdOrders: number;
  pendingOrders: number;
  inPreparationOrders: number;
  readyOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  expiredOrders: number;
  percent: number;
}

interface TrendBreakdownItem {
  label: string;
  value: string;
  tone?: MetricTone;
}

interface AlertItemView extends PanelKiosqueroAlertItem {
  quantityLabel: string;
  amountLabel: string;
}

const moneyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-AR');

const percentFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 1,
});

const PANEL_REALTIME_REFRESH_DELAY_MS = 2500;
const PANEL_REALTIME_REFRESH_TYPES = new Set([
  'DASHBOARD_CHANGED',
]);

@Injectable()
export class HomeKiosqueroPresenter {
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly homeKiosqueroService = inject(HomeKiosqueroService);
  private readonly inventoryRealtimeService = inject(InventoryRealtimeService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly panelState = signal<PanelKiosquero | null>(null);
  private readonly trendPanelState = signal<PanelKiosquero | null>(null);
  private readonly buffetIdState = signal<string | null>(null);
  private readonly nombreKiosqueroState = signal<string>('');
  private readonly selectedDateState = signal(this.getTodayInputDate());
  private readonly panelModeState = signal<PanelMode>('home');
  private readonly selectedRangePresetState =
    signal<ReportRangePreset>('TODAY');
  private readonly reportRangeFromState = signal(
    this.addDays(this.getTodayInputDate(), -6),
  );
  private readonly reportRangeToState = signal(this.getTodayInputDate());
  private readonly selectedTrendDateState = signal<string | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorMessageState = signal<string | null>(null);

  private requestSeq = 0;
  private trendRequestSeq = 0;
  private realtimeAbortController: AbortController | null = null;
  private realtimeRefreshTimeoutId: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.teardownRealtime());
  }

  readonly nombreKiosquero: Signal<string> =
    this.nombreKiosqueroState.asReadonly();
  readonly selectedDate: Signal<string> = this.selectedDateState.asReadonly();
  readonly selectedRangePreset: Signal<ReportRangePreset> =
    this.selectedRangePresetState.asReadonly();
  readonly reportRangeFrom: Signal<string> =
    this.reportRangeFromState.asReadonly();
  readonly reportRangeTo: Signal<string> =
    this.reportRangeToState.asReadonly();
  readonly panel: Signal<PanelKiosquero | null> = this.panelState.asReadonly();
  readonly isLoading: Signal<boolean> = this.loadingState.asReadonly();
  readonly errorMessage: Signal<string | null> =
    this.errorMessageState.asReadonly();

  readonly reportRangeOptions: ReportRangeOption[] = [
    { id: 'TODAY', label: 'Hoy' },
    { id: 'LAST_7_DAYS', label: 'Última semana' },
    { id: 'LAST_14_DAYS', label: 'Últimas 2 semanas' },
    { id: 'LAST_30_DAYS', label: 'Último mes' },
    { id: 'CUSTOM', label: 'Personalizado' },
  ];

  readonly urlFotoPerfil = computed<string | null>(() => this.perfilService.getPerfil()?.urlFotoPerfil ?? null);

  readonly iniciales = computed(() => {
    const partes = this.nombreKiosqueroState().trim().split(/\s+/);
    const primera = partes[0]?.[0] ?? '';
    const segunda = partes[1]?.[0] ?? partes[0]?.[1] ?? '';

    return (primera + segunda).toUpperCase();
  });

  readonly saludo = computed(() => {
    const hora = new Date().getHours();

    if (hora < 12) return 'Buen día,';
    if (hora < 19) return 'Buenas tardes,';

    return 'Buenas noches,';
  });

  readonly gananciasFormateadas = computed(() =>
    this.formatMoney(this.panelState()?.summary.totalSold ?? 0),
  );

  readonly ventasHoy = computed(
    () => this.panelState()?.summary.totalOrders ?? 0,
  );

  readonly productosSinStock = computed(
    () => this.panelState()?.summary.soldOutProducts ?? 0,
  );

  readonly panelDateLabel = computed(() =>
    this.formatDate(this.panelState()?.date ?? this.selectedDateState()),
  );

  readonly reportRangeLabel = computed(() => {
    const preset = this.selectedRangePresetState();

    if (preset !== 'CUSTOM') {
      return (
        this.reportRangeOptions.find((option) => option.id === preset)?.label ??
        'Período'
      );
    }

    return `${this.formatDate(this.reportRangeFromState())} al ${this.formatDate(this.reportRangeToState())}`;
  });

  readonly trendTitle = computed(() => 'Tendencia de ventas');

  readonly trendSubtitle = computed(() => {
    const days = this.trendDays().length;
    const daysLabel = days === 1 ? '1 día comparado' : `${days} días comparados`;

    if (this.selectedRangePresetState() === 'TODAY') {
      return `${daysLabel}`;
    }

    return `${this.reportRangeLabel()} · ${daysLabel}`;
  });

  readonly summaryMetrics = computed<PanelMetric[]>(() => {
    const summary = this.panelState()?.summary;

    return [
      {
        label: 'Total vendido',
        value: this.formatMoney(summary?.totalSold ?? 0),
        icon: 'fa-dollar-sign',
        tone: 'success',
      },
      {
        label: 'Pedidos totales',
        value: this.formatNumber(summary?.totalOrders ?? 0),
        icon: 'fa-receipt',
      },
      {
        label: 'Entregados',
        value: this.formatNumber(summary?.deliveredOrders ?? 0),
        icon: 'fa-circle-check',
        tone: 'success',
      },
      {
        label: 'Venta promedio',
        value: this.formatMoney(summary?.averageTicket ?? 0),
        icon: 'fa-chart-simple',
      },
      {
        label: 'A preparar',
        value: this.formatNumber(summary?.pendingOrders ?? 0),
        icon: 'fa-hourglass-half',
        tone: (summary?.pendingOrders ?? 0) > 0 ? 'warning' : undefined,
      },
      {
        label: 'Sin stock',
        value: this.formatNumber(summary?.soldOutProducts ?? 0),
        icon: 'fa-box-open',
        tone: (summary?.soldOutProducts ?? 0) > 0 ? 'danger' : undefined,
      },
    ];
  });

  readonly mainSummaryMetrics = computed<PanelMetric[]>(() => {
    const summary = this.panelState()?.summary;
    const totalOrders = summary?.totalOrders ?? 0;
    const deliveredOrders = summary?.deliveredOrders ?? 0;

    return [
      {
        label: 'Total vendido hoy',
        value: this.formatMoney(summary?.totalSold ?? 0),
        icon: 'fa-money-bill-wave',
        tone: 'success',
      },
      {
        label: 'Pedidos totales',
        value: this.formatNumber(totalOrders),
        icon: 'fa-receipt',
      },
      {
        label: 'Entregados',
        value: `${this.formatNumber(deliveredOrders)} / ${this.formatNumber(totalOrders)}`,
        icon: 'fa-circle-check',
        tone: 'success',
      },
    ];
  });

  readonly reportSummaryMetrics = computed<PanelMetric[]>(() => {
    const summary = this.panelState()?.summary;

    return [
      {
        label: 'Total vendido',
        value: this.formatMoney(summary?.totalSold ?? 0),
        icon: 'fa-dollar-sign',
        tone: 'success',
      },
      {
        label: 'Pedidos totales',
        value: this.formatNumber(summary?.totalOrders ?? 0),
        icon: 'fa-receipt',
      },
      {
        label: 'Entregados',
        value: this.formatNumber(summary?.deliveredOrders ?? 0),
        icon: 'fa-circle-check',
        tone: 'success',
      },
      {
        label: 'Venta promedio',
        value: this.formatMoney(summary?.averageTicket ?? 0),
        icon: 'fa-chart-simple',
      },
    ];
  });

  readonly operationalCards = computed<OperationalCard[]>(() => {
    const panel = this.panelState();
    const summary = panel?.summary;
    const alerts = panel?.alerts;

    const pendingOrders = summary?.pendingOrders ?? alerts?.pendingOrders ?? 0;
    const readyOrders = alerts?.readyOrders ?? 0;
    const expiredOrders = alerts?.expiredOrders ?? 0;

    return [
      {
        label: 'A preparar',
        value: this.formatNumber(pendingOrders),
        icon: 'fa-hourglass-half',
        status: 'PENDIENTE',
        helper: 'Pedidos pendientes del día',
        tone: pendingOrders > 0 ? 'warning' : 'success',
      },
      {
        label: 'Ya listos',
        value: this.formatNumber(readyOrders),
        icon: 'fa-bell-concierge',
        status: 'LISTO',
        helper: 'Avisar o entregar en mostrador',
        tone: readyOrders > 0 ? 'warning' : 'success',
      },
      {
        label: 'Vencidos',
        value: this.formatNumber(expiredOrders),
        icon: 'fa-clock-rotate-left',
        status: 'VENCIDO',
        helper: 'Revisar cierre y liberaciones',
        tone: expiredOrders > 0 ? 'danger' : 'success',
      },
    ];
  });

  readonly attentionItems = computed<AttentionItem[]>(() => {
    return this.operationalCards().map((card) => ({
      label: card.label,
      value: card.value,
      icon: card.icon,
      tone: card.tone,
    }));
  });

  readonly salesByTimeSlot = computed<TimeSlotView[]>(() => {
    const slots = this.redistributeUnassignedTimeSlotSales([
      ...(this.panelState()?.activity.salesByTimeSlot ?? []),
    ]).sort((left, right) => this.compareTimeSlots(left, right));
    const maxSold = Math.max(1, ...slots.map((slot) => slot.totalSold));

    return slots.map((slot) => ({
      ...slot,
      ordersLabel: `${this.formatNumber(slot.orders)} pedidos`,
      totalSoldLabel: this.formatMoney(slot.totalSold),
      timeRangeLabel: this.formatTimeRange(
        slot.pickupSlotStartTime,
        slot.pickupSlotEndTime,
      ),
      percent: Math.round((slot.totalSold / maxSold) * 100),
    }));
  });

  readonly salesByCategory = computed<CategorySaleView[]>(() => {
    const panel = this.panelState();
    const categories = panel?.activity.salesByCategory ?? [];
    const maxQuantity = Math.max(
      1,
      ...categories.map((category) => category.quantity),
    );
    const fallbackTotalSold = categories.reduce(
      (total, category) => total + category.total,
      0,
    );
    const totalSold = panel?.summary.totalSold ?? fallbackTotalSold;

    return categories.map((category) => {
      const totalPercent = this.calculatePercent(category.total, totalSold, 1);

      return {
        ...category,
        quantityLabel: `${this.formatNumber(category.quantity)} unidades`,
        totalLabel: this.formatMoney(category.total),
        barPercent: this.calculatePercent(category.quantity, maxQuantity),
        totalPercent,
        totalPercentLabel: this.formatPercent(totalPercent),
      };
    });
  });

  readonly ordersByStatus = computed<PanelKiosqueroOrdersByStatus[]>(
    () => this.panelState()?.activity.ordersByStatus ?? [],
  );

  readonly orderedStatusItems = computed<PanelKiosqueroOrdersByStatus[]>(() => {
    const currentItems = this.ordersByStatus();
    const byStatus = new Map<string, PanelKiosqueroOrdersByStatus>(
      currentItems.map((item) => [item.status, item]),
    );

    const defaults = [
      { status: 'PENDIENTE', label: 'A preparar' },
      { status: 'EN_PREPARACION', label: 'En preparación' },
      { status: 'LISTO', label: 'Listo para retirar' },
      { status: 'ENTREGADO', label: 'Entregado' },
      { status: 'CANCELADO', label: 'Cancelado' },
      { status: 'RECHAZADO', label: 'Rechazado' },
      { status: 'VENCIDO', label: 'Vencido' },
    ];

    return defaults.map((item) => {
      const existing = byStatus.get(item.status);

      if (existing) {
        return existing;
      }

      return {
        status: item.status,
        label: item.label,
        orders: 0,
      } as PanelKiosqueroOrdersByStatus;
    });
  });

  readonly ordersByPurchaseType = computed<PurchaseTypeView[]>(() => {
    const purchaseTypes =
      this.panelState()?.activity.ordersByPurchaseType ?? [];
    const totalOrders = purchaseTypes.reduce((acc, item) => acc + item.orders, 0);
    const safeTotal = Math.max(1, totalOrders);
    const totalLabel = this.formatNumber(totalOrders);

    return purchaseTypes.map((item) => {
      const ordersLabel = this.formatNumber(item.orders);
      const percent = Math.round((item.orders / safeTotal) * 100);

      return {
        type: item.type,
        label: this.formatPurchaseType(item.type),
        ordersLabel,
        shareLabel: `${ordersLabel} de ${totalLabel} compras`,
        percentLabel: `${percent}%`,
        percent,
      };
    });
  });

  readonly productGroups = computed<ProductGroup[]>(() => {
    const products = this.panelState()?.products;

    return [
      {
        title: 'Más vendidos',
        icon: 'fa-ranking-star',
        emptyLabel: 'Sin ventas para este período.',
        items: (products?.topSoldProducts ?? []).map((product) =>
          this.productTotalToItem(product),
        ),
      },
      {
        title: 'Más reservados ahora',
        icon: 'fa-bookmark',
        emptyLabel: 'Sin productos reservados actualmente.',
        items: (products?.mostReservedProducts ?? []).map((product) =>
          this.productTotalToItem(product),
        ),
      },
      {
        title: 'Reposición',
        icon: 'fa-boxes-stacked',
        emptyLabel: 'No hay productos bajo mínimo.',
        items: this.getLowStockProducts(
          products?.productsNeedingRestock ?? [],
        ).map((product) => this.inventoryProductToItem(product, 'warning')),
      },
      {
        title: 'Agotados',
        icon: 'fa-triangle-exclamation',
        emptyLabel: 'No hay productos agotados.',
        items: (products?.soldOutProducts ?? []).map((product) =>
          this.inventoryProductToItem(product, 'danger'),
        ),
      },
    ];
  });

  readonly criticalProductGroups = computed<ProductGroup[]>(() => {
    const panel = this.panelState();
    const summary = panel?.summary;
    const products = panel?.products;

    const soldOutTotal = summary?.soldOutProducts ?? 0;
    const soldOutItems = (products?.soldOutProducts ?? []).map((product) =>
      this.inventoryProductToItem(product, 'danger'),
    );
    const lowStockItems = this.getLowStockProducts(
      products?.productsNeedingRestock ?? [],
    ).map((product) => this.inventoryProductToItem(product, 'warning'));

    const groups: (ProductGroup | null)[] = [
      soldOutTotal > 0 || soldOutItems.length > 0
        ? {
          title: 'Productos sin stock',
          icon: 'fa-triangle-exclamation',
          emptyLabel: 'Hay productos agotados, pero no llegó el detalle.',
          items: soldOutItems,
          countLabel: this.formatNumber(soldOutTotal),
          tone: 'danger',
        }
        : null,
      lowStockItems.length > 0
        ? {
          title: 'Productos bajo stock',
          icon: 'fa-boxes-stacked',
          emptyLabel: 'No hay productos bajo mínimo.',
          items: lowStockItems,
          countLabel: this.formatNumber(lowStockItems.length),
          tone: 'warning',
        }
        : null,
    ];

    return groups.filter((group): group is ProductGroup => group !== null);
  });

  readonly hasCriticalStock = computed(() => {
    return this.criticalProductGroups().length > 0;
  });

  readonly stockOverview = computed<PanelMetric[]>(() => {
    const summary = this.panelState()?.summary;
    const products = this.panelState()?.products;
    const soldOutTotal = summary?.soldOutProducts ?? 0;
    const lowStockTotal = this.getLowStockProducts(
      products?.productsNeedingRestock ?? [],
    ).length;

    return [
      {
        label: 'Agotados',
        value: this.formatNumber(soldOutTotal),
        icon: 'fa-box-open',
        tone: soldOutTotal > 0 ? 'danger' : 'success',
      },
      {
        label: 'Bajo stock',
        value: this.formatNumber(lowStockTotal),
        icon: 'fa-triangle-exclamation',
        tone: lowStockTotal > 0 ? 'warning' : 'success',
      },
    ];
  });

  readonly rankingProductGroups = computed<ProductGroup[]>(() => {
    const products = this.panelState()?.products;

    return [
      {
        title: 'Más vendidos',
        icon: 'fa-ranking-star',
        emptyLabel: 'Sin ventas para este período.',
        items: (products?.topSoldProducts ?? []).map((product) =>
          this.productTotalToItem(product),
        ),
      },
      {
        title: 'Más reservados ahora',
        icon: 'fa-bookmark',
        emptyLabel: 'Sin productos reservados actualmente.',
        items: (products?.mostReservedProducts ?? []).map((product) =>
          this.productTotalToItem(product),
        ),
      },
    ];
  });

  readonly alertMetrics = computed<PanelMetric[]>(() => {
    const alerts = this.panelState()?.alerts;

    return [
      {
        label: 'Pedidos vencidos',
        value: this.formatNumber(alerts?.expiredOrders ?? 0),
        icon: 'fa-clock',
        tone: (alerts?.expiredOrders ?? 0) > 0 ? 'warning' : undefined,
      },
      {
        label: 'Reservas liberadas',
        value: this.formatNumber(alerts?.releasedReservations ?? 0),
        icon: 'fa-lock-open',
      },
      {
        label: 'Créditos devueltos',
        value: this.formatMoney(alerts?.refundedCredits ?? 0),
        icon: 'fa-rotate-left',
      },
      {
        label: 'Eventos sin stock del día',
        value: this.formatNumber(alerts?.soldOutEvents ?? 0),
        icon: 'fa-box-open',
        tone: (alerts?.soldOutEvents ?? 0) > 0 ? 'danger' : undefined,
      },
      {
        label: 'A preparar',
        value: this.formatNumber(alerts?.pendingOrders ?? 0),
        icon: 'fa-hourglass-half',
        tone: (alerts?.pendingOrders ?? 0) > 0 ? 'warning' : undefined,
      },
      {
        label: 'Listos',
        value: this.formatNumber(alerts?.readyOrders ?? 0),
        icon: 'fa-bell-concierge',
      },
    ];
  });

  readonly visibleAlertMetrics = computed<PanelMetric[]>(() => {
    return this.alertMetrics().filter((metric) =>
      this.hasPositiveValue(metric.value),
    );
  });

  readonly reportAlertMetrics = computed<PanelMetric[]>(() =>
    this.visibleAlertMetrics(),
  );

  readonly alertItems = computed<AlertItemView[]>(() =>
    (this.panelState()?.alerts.items ?? []).map((item) => ({
      ...item,
      quantityLabel: this.formatNumber(item.quantity),
      amountLabel: this.formatMoney(item.amount),
    })),
  );

  readonly visibleAlertItems = computed<AlertItemView[]>(() => {
    return this.alertItems().filter(
      (item) => item.quantity > 0 || item.amount > 0,
    );
  });

  readonly hasVisibleAlerts = computed(() => {
    return (
      this.visibleAlertMetrics().length > 0 ||
      this.visibleAlertItems().length > 0
    );
  });

  readonly hasReportAlerts = computed(() => {
    return this.reportAlertMetrics().length > 0;
  });

  readonly trendDays = computed<TrendDayView[]>(() => {
    const panel =
      this.selectedRangePresetState() === 'TODAY'
        ? this.trendPanelState() ?? this.panelState()
        : this.panelState();
    const trends = panel?.trends;
    const days = trends?.salesByDay?.length
      ? trends.salesByDay
      : trends?.lastSevenDays ?? [];
    const maxSold = Math.max(1, ...days.map((day) => day.totalSold));

    return days.map((day) => {
      const createdOrders = day.createdOrders ?? day.totalOrders ?? 0;
      const pendingOrders = day.pendingOrders ?? 0;
      const inPreparationOrders = day.inPreparationOrders ?? 0;
      const readyOrders = day.readyOrders ?? 0;
      const cancelledOrders = day.cancelledOrders ?? 0;
      const rejectedOrders = day.rejectedOrders ?? 0;
      const expiredOrders = day.expiredOrders ?? 0;
      const nonDeliveredOrders = Math.max(
        0,
        createdOrders - day.deliveredOrders,
      );

      return {
        ...day,
        createdOrders,
        pendingOrders,
        inPreparationOrders,
        readyOrders,
        cancelledOrders,
        rejectedOrders,
        expiredOrders,
        dateLabel: this.formatShortDate(day.date),
        totalSoldLabel: this.formatMoney(day.totalSold),
        totalOrdersLabel: `${this.formatNumber(day.totalOrders)} pedidos`,
        createdOrdersLabel: `${this.formatNumber(createdOrders)} pedidos hechos`,
        deliveredOrdersLabel: `${this.formatNumber(day.deliveredOrders)} entregados`,
        nonDeliveredOrdersLabel: `${this.formatNumber(nonDeliveredOrders)} no entregados`,
        pendingOrdersLabel: `${this.formatNumber(pendingOrders)} pendientes`,
        inPreparationOrdersLabel: `${this.formatNumber(inPreparationOrders)} en preparación`,
        readyOrdersLabel: `${this.formatNumber(readyOrders)} listos`,
        cancelledOrdersLabel: `${this.formatNumber(cancelledOrders)} cancelados`,
        rejectedOrdersLabel: `${this.formatNumber(rejectedOrders)} rechazados`,
        expiredOrdersLabel: `${this.formatNumber(expiredOrders)} vencidos`,
        percent: Math.round((day.totalSold / maxSold) * 100),
      };
    });
  });

  readonly selectedTrendDay = computed<TrendDayView | null>(() => {
    const days = this.trendDays();

    if (!days.length) {
      return null;
    }

    const selectedDate = this.selectedTrendDateState();

    return (
      days.find((day) => day.date === selectedDate) ?? days[days.length - 1]
    );
  });

  readonly bestTrendDay = computed<TrendDayView | null>(() => {
    return this.trendDays().reduce<TrendDayView | null>((bestDay, day) => {
      if (!bestDay || day.totalSold > bestDay.totalSold) {
        return day;
      }

      return bestDay;
    }, null);
  });

  readonly selectedTrendBreakdown = computed<TrendBreakdownItem[]>(() => {
    const day = this.selectedTrendDay();

    if (!day) {
      return [];
    }

    const notDelivered = Math.max(0, day.createdOrders - day.deliveredOrders);

    return [
      {
        label: 'Pedidos hechos',
        value: this.formatNumber(day.createdOrders),
        tone: notDelivered > 0 ? 'warning' : 'success',
      },
      {
        label: 'Entregados',
        value: this.formatNumber(day.deliveredOrders),
        tone: 'success',
      },
      {
        label: 'Pendientes',
        value: this.formatNumber(day.pendingOrders),
        tone: day.pendingOrders > 0 ? 'warning' : undefined,
      },
      {
        label: 'En preparación',
        value: this.formatNumber(day.inPreparationOrders),
        tone: day.inPreparationOrders > 0 ? 'warning' : undefined,
      },
      {
        label: 'Listos',
        value: this.formatNumber(day.readyOrders),
        tone: day.readyOrders > 0 ? 'warning' : undefined,
      },
      {
        label: 'Cancelados',
        value: this.formatNumber(day.cancelledOrders),
        tone: day.cancelledOrders > 0 ? 'danger' : undefined,
      },
      {
        label: 'Rechazados',
        value: this.formatNumber(day.rejectedOrders),
        tone: day.rejectedOrders > 0 ? 'danger' : undefined,
      },
      {
        label: 'Vencidos',
        value: this.formatNumber(day.expiredOrders),
        tone: day.expiredOrders > 0 ? 'danger' : undefined,
      },
    ];
  });

  readonly hasPanelData = computed(() => this.panelState() !== null);

  readonly acciones: Signal<AccionKiosquero[]> = computed(() => [
    {
      id: 'ver-pedidos',
      titulo: 'Ver pedidos',
      descripcion: 'Pendientes, preparación y retiros',
      icono: 'fa-list-check',
      ruta: `/kiosquero/pedidos-tracking`,
      color: 'pizarra',
    },
    {
      id: 'venta-espontanea',
      titulo: 'Venta',
      descripcion: 'Registra una venta presencial a un alumno',
      icono: 'fa-cash-register',
      ruta: '/kiosquero/venta-espontanea',
      color: 'pizarra',
      destacada: true,
    },
    {
      id: 'cargar-productos',
      titulo: 'Cargar producto',
      descripcion: 'Elige un método para agregar productos',
      icono: 'fa-cloud-arrow-up',
      ruta: '/cargar-producto-ia',
      color: 'dorado',

    },
    {
      id: 'oportunidades-stock',
      titulo: 'Oportunidades de Stock',
      descripcion: 'Descubrir nuevos productos',
      icono: 'fa-rocket',
      ruta: '/sugerencias-agregar',
      color: 'menta',
      destacada: true,
      premium: true,
    },
    {
      id: 'tracking-pedidos',
      titulo: 'Seguimiento de pedidos',
      descripcion: 'Monitorea y entrega los pedidos recibidos',
      icono: 'fa-clipboard-list',
      ruta: '/kiosquero/pedidos-tracking',
      color: 'menta',
      destacada: true,
    },
    {
      id: 'stock',
      titulo: 'Stock',
      descripcion: 'Inventario y reposición',
      icono: 'fa-boxes-stacked',
      ruta: '/admin-productos',
      color: 'violeta',
    },
    {
      id: 'reportes',
      titulo: 'Panel de control',
      descripcion: 'Métricas y reportes',
      icono: 'fa-chart-line',
      ruta: '/kiosquero/reportes',
      color: 'pizarra',
    },
    {
      id: 'sugerencias',
      titulo: 'Impulsar Baja Rotación',
      descripcion: 'Armar combos para mover stock estancado',
      icono: 'fa-robot',
      ruta: '/sugerencias',
      color: 'melocoton',
      destacada: true,
      premium: true,
    },
    {
      id: 'recomendaciones',
      titulo: 'Recomendaciones estacionales',
      descripcion: 'Qué stockear según la temporada',
      icono: 'fa-leaf',
      ruta: '/recomendaciones-estacionales',
      color: 'menta',
    },
    {
      id: 'promociones',
      titulo: 'Promociones',
      descripcion: 'Crear y editar descuentos',
      icono: 'fa-tags',
      ruta: '/promociones',
      color: 'violeta',
    },
    {
      id: 'cierre-diario',
      titulo: 'Cierre diario',
      descripcion: 'Cerrar día y liberar reservas',
      icono: 'fa-clipboard-check',
      ruta: '/cierre-diario',
      color: 'melocoton',
    },
  ]);

  readonly primaryAction = computed<AccionKiosquero | null>(() => {
    return (
      this.acciones().find((accion) => accion.id === 'ver-pedidos') ?? null
    );
  });

  readonly secondaryActions = computed<AccionKiosquero[]>(() => {
    return this.acciones().filter(
      (accion) =>
        ![
          'ver-pedidos',
          'cargar-productos',
          'tracking-pedidos',
          'stock',
          'reportes',
          'sugerencias',
          'recomendaciones',
          'promociones',
          'cierre-diario',
        ].includes(accion.id) && !accion.destacada,
    );
  });

  readonly featuredActions: Signal<AccionKiosquero[]> = computed(() =>
    this.ordenarAccionesDestacadas([
      ...this.acciones().filter(
        (accion) => accion.destacada && accion.id !== 'tracking-pedidos',
      ),
      {
        id: 'cargar-productos',
        titulo: 'Cargar producto',
        descripcion: 'Elige un método para agregar productos',
        icono: 'fa-cloud-arrow-up',
        ruta: '/cargar-producto-ia',
        color: 'dorado',
      },
      {
        id: 'cierre-diario',
        titulo: 'Cierre diario',
        descripcion: 'Cerrar día y liberar reservas',
        icono: 'fa-clipboard-check',
        ruta: '/cierre-diario',
        color: 'menta',
      },
    ]),
  );

  private ordenarAccionesDestacadas(
    actions: AccionKiosquero[],
  ): AccionKiosquero[] {
    const ventaAction = actions.find(
      (action) => action.id === 'venta-espontanea',
    );
    const cargarProductoAction = actions.find(
      (action) => action.id === 'cargar-productos',
    );

    if (!ventaAction || !cargarProductoAction) {
      return actions;
    }

    return [
      ventaAction,
      cargarProductoAction,
      ...actions.filter(
        (action) =>
          action.id !== 'venta-espontanea' &&
          action.id !== 'cargar-productos',
      ),
    ];
  }

  init(): void {
    this.panelModeState.set('home');
    const perfil = this.perfilService.getPerfil();

    const nombre = perfil
      ? `${perfil.nombre} ${perfil.apellido}`.trim()
      : this.homeKiosqueroService.getNombreKiosquero();

    this.nombreKiosqueroState.set(
      nombre || this.homeKiosqueroService.getNombreKiosquero(),
    );

    this.usuarioService.setNombreNavbar(this.nombreKiosqueroState());

    const buffetId = this.perfilService.obtenerBuffetId();
    this.buffetIdState.set(buffetId);

    if (!buffetId) {
      this.errorMessageState.set(
        'No se encontró un buffet asociado a tu perfil.',
      );
      return;
    }

    this.cargarPanel();
    this.connectRealtime(buffetId);
  }

  initReportes(): void {
    this.panelModeState.set('reportes');
    const perfil = this.perfilService.getPerfil();

    const nombre = perfil
      ? `${perfil.nombre} ${perfil.apellido}`.trim()
      : this.homeKiosqueroService.getNombreKiosquero();

    this.nombreKiosqueroState.set(
      nombre || this.homeKiosqueroService.getNombreKiosquero(),
    );

    this.usuarioService.setNombreNavbar(this.nombreKiosqueroState());

    const buffetId = this.perfilService.obtenerBuffetId();
    this.buffetIdState.set(buffetId);

    if (!buffetId) {
      this.errorMessageState.set(
        'No se encontró un buffet asociado a tu perfil.',
      );
      return;
    }

    this.selectedRangePresetState.set('TODAY');
    this.applyReportRangePreset('TODAY');
    this.cargarPanelReportes();
    this.connectRealtime(buffetId);
  }

  onDateChange(event: Event): void {
    const nextDate = (event.target as HTMLInputElement | null)?.value;

    if (!nextDate || nextDate === this.selectedDateState()) {
      return;
    }

    this.selectedDateState.set(nextDate);
    this.cargarPanel();
  }

  refrescarPanel(): void {
    this.cargarPanel();
  }

  onReportRangePresetChange(event: Event): void {
    const preset = (event.target as HTMLSelectElement | null)?.value;

    if (!this.isReportRangePreset(preset)) {
      return;
    }

    this.selectedRangePresetState.set(preset);

    if (preset === 'CUSTOM') {
      return;
    }

    this.applyReportRangePreset(preset);
    this.cargarPanelReportes();
  }

  onReportRangeFromChange(event: Event): void {
    const nextDate = (event.target as HTMLInputElement | null)?.value;

    if (!nextDate || nextDate === this.reportRangeFromState()) {
      return;
    }

    this.selectedRangePresetState.set('CUSTOM');
    this.reportRangeFromState.set(nextDate);
    this.cargarPanelReportes();
  }

  onReportRangeToChange(event: Event): void {
    const nextDate = (event.target as HTMLInputElement | null)?.value;

    if (!nextDate || nextDate === this.reportRangeToState()) {
      return;
    }

    this.selectedRangePresetState.set('CUSTOM');
    this.reportRangeToState.set(nextDate);
    this.cargarPanelReportes();
  }

  refrescarReportes(): void {
    this.cargarPanelReportes();
  }

  selectTrendDay(date: string): void {
    this.selectedTrendDateState.set(date);
  }

  ejecutarAccion(accion: AccionKiosquero): void {
    this.router.navigateByUrl(accion.ruta);
  }

  abrirPedidos(status: KiosqueroOrderStatus): void {
    this.router.navigate(['/cierre-diario'], {
      queryParams: {
        date: this.selectedDateState(),
        status,
      },
    });
  }

  abrirStock(): void {
    this.router.navigateByUrl('/admin-productos');
  }

  abrirReportes(): void {
    this.router.navigateByUrl('/kiosquero/reportes');
  }

  reponerStock(item: ProductListItem): void {
    this.router.navigate(['/admin-productos'], {
      queryParams: {
        productId: item.id,
      },
    });
  }

  trackMetric(_: number, metric: PanelMetric): string {
    return metric.label;
  }

  trackAttentionItem(_: number, item: AttentionItem): string {
    return item.label;
  }

  trackTimeSlot(_: number, slot: TimeSlotView): string {
    return slot.pickupSlotId ?? slot.timeSlot;
  }

  trackStatus(_: number, status: PanelKiosqueroOrdersByStatus): string {
    return status.status;
  }

  trackPurchaseType(_: number, item: PurchaseTypeView): string {
    return item.type;
  }

  trackProductGroup(_: number, group: ProductGroup): string {
    return group.title;
  }

  trackProductItem(_: number, item: ProductListItem): string {
    return item.id;
  }

  trackAlertItem(_: number, item: AlertItemView): string {
    return item.type;
  }

  trackTrendDay(_: number, day: TrendDayView): string {
    return day.date;
  }

  private cargarPanel(showLoading = true): void {
    const buffetId = this.buffetIdState();

    if (!buffetId) {
      return;
    }

    const requestId = ++this.requestSeq;
    const selectedDate = this.selectedDateState();

    if (showLoading) {
      this.loadingState.set(true);
      this.errorMessageState.set(null);
    }

    this.homeKiosqueroService
      .getPanel(buffetId, selectedDate)
      .pipe(
        finalize(() => {
          if (showLoading && requestId === this.requestSeq) {
            this.loadingState.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (panel) => {
          if (requestId === this.requestSeq) {
            this.panelState.set(panel);
            this.ensureSelectedTrendDay();
          }
        },
        error: () => {
          if (showLoading && requestId === this.requestSeq) {
            this.panelState.set(null);
            this.errorMessageState.set(
              'No se pudo cargar el estado del buffet.',
            );
          }
        },
      });
  }

  private cargarPanelReportes(showLoading = true): void {
    const buffetId = this.buffetIdState();

    if (!buffetId) {
      return;
    }

    const range = this.getReportRange();

    if (!this.isReportRangeValid(range)) {
      this.errorMessageState.set(
        'El rango de fechas no es válido para el dashboard.',
      );
      return;
    }

    const requestId = ++this.requestSeq;

    if (showLoading) {
      this.loadingState.set(true);
      this.errorMessageState.set(null);
    }

    this.homeKiosqueroService
      .getPanelByRange(buffetId, range)
      .pipe(
        finalize(() => {
          if (showLoading && requestId === this.requestSeq) {
            this.loadingState.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (panel) => {
          if (requestId === this.requestSeq) {
            this.panelState.set(panel);

            if (this.selectedRangePresetState() === 'TODAY') {
              this.cargarTendenciaReportes();
            } else {
              this.trendPanelState.set(null);
            }

            this.ensureSelectedTrendDay();
          }
        },
        error: () => {
          if (showLoading && requestId === this.requestSeq) {
            this.panelState.set(null);
            this.errorMessageState.set(
              'No se pudo cargar el dashboard del período.',
            );
          }
        },
      });
  }

  private cargarTendenciaReportes(): void {
    const buffetId = this.buffetIdState();

    if (!buffetId) {
      return;
    }

    const requestId = ++this.trendRequestSeq;
    const range = this.getLastSevenDaysRange();

    this.homeKiosqueroService
      .getPanelByRange(buffetId, range)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (panel) => {
          if (
            requestId === this.trendRequestSeq &&
            this.selectedRangePresetState() === 'TODAY'
          ) {
            this.trendPanelState.set(panel);
            this.ensureSelectedTrendDay();
          }
        },
        error: () => {
          if (requestId === this.trendRequestSeq) {
            this.trendPanelState.set(null);
          }
        },
      });
  }

  private connectRealtime(buffetId: string): void {
    this.realtimeAbortController?.abort();

    this.realtimeAbortController = this.inventoryRealtimeService.connect(
      buffetId,
      {
        onRefresh: (event) => {
          this.zone.run(() => this.scheduleRealtimeRefresh(event));
        },
        onError: (error) => {
          console.warn('SSE del panel desconectado o reintentando', error);
        },
      },
    );
  }

  private scheduleRealtimeRefresh(event: RealtimeInventoryEvent): void {
    if (
      !this.shouldRefreshPanelForRealtimeEvent(event) ||
      this.realtimeRefreshTimeoutId !== null
    ) {
      return;
    }

    this.realtimeRefreshTimeoutId = window.setTimeout(() => {
      this.realtimeRefreshTimeoutId = null;

      if (!this.shouldRefreshPanelForRealtimeEvent(event)) {
        return;
      }

      if (this.panelModeState() === 'reportes') {
        this.inventoryRealtimeService.recordRefetch('kiosquero-reportes-panel');
        this.cargarPanelReportes(false);
        return;
      }

      this.inventoryRealtimeService.recordRefetch('home-kiosquero-panel');
      this.cargarPanel(false);
    }, PANEL_REALTIME_REFRESH_DELAY_MS);
  }

  private teardownRealtime(): void {
    this.realtimeAbortController?.abort();
    this.realtimeAbortController = null;

    if (this.realtimeRefreshTimeoutId !== null) {
      window.clearTimeout(this.realtimeRefreshTimeoutId);
      this.realtimeRefreshTimeoutId = null;
    }
  }

  private getOrdersByStatusCount(status: KiosqueroOrderStatus): number {
    return (
      this.panelState()?.activity.ordersByStatus.find(
        (item) => item.status === status,
      )?.orders ?? 0
    );
  }

  private getLowStockProducts(
    products: PanelKiosqueroInventoryProduct[],
  ): PanelKiosqueroInventoryProduct[] {
    return products.filter(
      (product) => product.estadoInventario === 'BAJO_STOCK',
    );
  }

  private productTotalToItem(
    product: PanelKiosqueroProductTotal,
  ): ProductListItem {
    return {
      id: product.productId,
      label: product.productName,
      detail: `${this.formatNumber(product.quantity)} unidades`,
      imageUrl: product.urlImagen,
      amount: this.formatMoney(product.total),
    };
  }

  private inventoryProductToItem(
    product: PanelKiosqueroInventoryProduct,
    tone: MetricTone,
  ): ProductListItem {
    return {
      id: product.productId,
      label: product.productName,
      detail: `Disponible ${this.formatNumber(product.stockDisponible)} / mínimo ${this.formatNumber(product.stockMinimo)} - ${this.formatInventoryStatus(product.estadoInventario)}`,
      imageUrl: product.urlImagen,
      tone,
    };
  }

  private formatMoney(value: number | null | undefined): string {
    return moneyFormatter.format(Number(value ?? 0));
  }

  private formatNumber(value: number | null | undefined): string {
    return numberFormatter.format(Number(value ?? 0));
  }

  private formatPercent(value: number): string {
    return `${percentFormatter.format(value)}%`;
  }

  private calculatePercent(
    value: number | null | undefined,
    total: number | null | undefined,
    decimalPlaces = 0,
  ): number {
    const safeTotal = Number(total ?? 0);

    if (safeTotal <= 0) {
      return 0;
    }

    const factor = Math.pow(10, decimalPlaces);
    const rawPercent = (Number(value ?? 0) / safeTotal) * 100;

    return Math.round((rawPercent + Number.EPSILON) * factor) / factor;
  }

  private formatPurchaseType(type: KiosqueroPurchaseType): string {
    const labels: Record<KiosqueroPurchaseType, string> = {
      PRESENCIAL: 'Presencial',
      ANTICIPADA: 'Anticipada',
    };

    return labels[type] ?? type;
  }

  private formatInventoryStatus(status: KiosqueroInventoryStatus): string {
    const labels: Record<KiosqueroInventoryStatus, string> = {
      DISPONIBLE: 'Disponible',
      BAJO_STOCK: 'Bajo stock',
      SIN_STOCK: 'Sin stock',
      DESACTIVADO: 'Desactivado',
    };

    return labels[status] ?? status;
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return '-';

    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  private formatShortDate(value: string): string {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}`;
  }

  private formatTimeRange(
    startTime: string | null | undefined,
    endTime: string | null | undefined,
  ): string | null {
    if (!startTime || !endTime) {
      return null;
    }

    return [
      this.formatClockTime(startTime),
      this.formatClockTime(endTime),
    ].join(' - ');
  }

  private formatClockTime(value: string): string {
    const [hours, minutes] = value.split(':');

    if (!hours || !minutes) {
      return value;
    }

    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  private redistributeUnassignedTimeSlotSales(
    slots: PanelKiosqueroTimeSlotSale[],
  ): PanelKiosqueroTimeSlotSale[] {
    const assignedSlots = slots.filter((slot) => this.hasTimeSlotRange(slot));
    const unassignedSlots = slots.filter((slot) => !this.hasTimeSlotRange(slot));

    if (!assignedSlots.length || !unassignedSlots.length) {
      return slots;
    }

    const unassignedOrders = unassignedSlots.reduce(
      (total, slot) => total + slot.orders,
      0,
    );
    const unassignedTotalSold = unassignedSlots.reduce(
      (total, slot) => total + slot.totalSold,
      0,
    );
    const ordersShares = this.splitInteger(unassignedOrders, assignedSlots.length);
    const totalSoldShares = this.splitInteger(
      unassignedTotalSold,
      assignedSlots.length,
    );

    return assignedSlots.map((slot, index) => ({
      ...slot,
      orders: slot.orders + ordersShares[index],
      totalSold: slot.totalSold + totalSoldShares[index],
    }));
  }

  private hasTimeSlotRange(slot: PanelKiosqueroTimeSlotSale): boolean {
    return Boolean(slot.pickupSlotStartTime && slot.pickupSlotEndTime);
  }

  private splitInteger(total: number, parts: number): number[] {
    if (parts <= 0) {
      return [];
    }

    const base = Math.floor(total / parts);
    const remainder = total % parts;

    return Array.from({ length: parts }, (_, index) =>
      base + (index < remainder ? 1 : 0),
    );
  }

  private compareTimeSlots(
    left: PanelKiosqueroTimeSlotSale,
    right: PanelKiosqueroTimeSlotSale,
  ): number {
    const leftStart = left.pickupSlotStartTime;
    const rightStart = right.pickupSlotStartTime;

    if (!leftStart && !rightStart) {
      return left.timeSlot.localeCompare(right.timeSlot);
    }

    if (!leftStart) {
      return 1;
    }

    if (!rightStart) {
      return -1;
    }

    return leftStart.localeCompare(rightStart);
  }

  private applyReportRangePreset(
    preset: Exclude<ReportRangePreset, 'CUSTOM'>,
  ): void {
    const today = this.getTodayInputDate();
    const daysBackByPreset: Record<
      Exclude<ReportRangePreset, 'CUSTOM'>,
      number
    > = {
      TODAY: 0,
      LAST_7_DAYS: 6,
      LAST_14_DAYS: 13,
      LAST_30_DAYS: 29,
    };

    this.reportRangeToState.set(today);
    this.reportRangeFromState.set(
      this.addDays(today, -daysBackByPreset[preset]),
    );
  }

  private getReportRange(): DashboardRangeParams {
    return {
      from: this.reportRangeFromState(),
      to: this.reportRangeToState(),
    };
  }

  private getLastSevenDaysRange(): DashboardRangeParams {
    const today = this.getTodayInputDate();

    return {
      from: this.addDays(today, -6),
      to: today,
    };
  }

  private isReportRangeValid(range: DashboardRangeParams): boolean {
    if (!range.from || !range.to || range.from > range.to) {
      return false;
    }

    return this.countInclusiveDays(range.from, range.to) <= 366;
  }

  private isReportRangePreset(
    value: string | null | undefined,
  ): value is ReportRangePreset {
    return this.reportRangeOptions.some((option) => option.id === value);
  }

  private ensureSelectedTrendDay(): void {
    const days = this.trendDays();

    if (!days.length) {
      this.selectedTrendDateState.set(null);
      return;
    }

    const selectedDate = this.selectedTrendDateState();

    if (!selectedDate || !days.some((day) => day.date === selectedDate)) {
      this.selectedTrendDateState.set(days[days.length - 1].date);
    }
  }

  private isSelectedDateToday(): boolean {
    return this.selectedDateState() === this.getTodayInputDate();
  }

  private shouldRefreshPanelForRealtimeEvent(
    event: RealtimeInventoryEvent,
  ): boolean {
    return (
      document.visibilityState === 'visible' &&
      this.isRealtimeEventForCurrentPanel(event) &&
      PANEL_REALTIME_REFRESH_TYPES.has(event.type)
    );
  }

  private isRealtimeEventForCurrentPanel(event: RealtimeInventoryEvent): boolean {
    if (this.panelModeState() === 'reportes') {
      return this.isRealtimeEventForReportRange(event);
    }

    return this.isRealtimeEventForSelectedDate(event);
  }

  private isRealtimeEventForReportRange(event: RealtimeInventoryEvent): boolean {
    const eventDate = event.date?.trim() || this.getTodayInputDate();
    const range = this.getReportRange();

    return eventDate >= range.from && eventDate <= range.to;
  }

  private isRealtimeEventForSelectedDate(event: RealtimeInventoryEvent): boolean {
    const eventDate = event.date?.trim();

    if (eventDate) {
      return eventDate === this.selectedDateState();
    }

    return this.isSelectedDateToday();
  }

  private getTodayInputDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private addDays(value: string, days: number): string {
    const date = this.parseInputDate(value);

    date.setDate(date.getDate() + days);

    return this.formatInputDate(date);
  }

  private countInclusiveDays(from: string, to: string): number {
    const fromTime = this.parseInputDate(from).getTime();
    const toTime = this.parseInputDate(to).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    return Math.floor((toTime - fromTime) / dayMs) + 1;
  }

  private parseInputDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, (month ?? 1) - 1, day ?? 1);
  }

  private formatInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private hasPositiveValue(value: string | number): boolean {
    if (typeof value === 'number') {
      return value > 0;
    }

    const normalized = value
      .replace(/\$/g, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    return Number(normalized) > 0;
  }
}
