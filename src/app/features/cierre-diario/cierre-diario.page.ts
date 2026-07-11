import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { InventarioRealtimeService } from '../inventario/services/inventario-realtime.service';
import { EventoInventarioRealtime } from '../inventario/models/inventario.interface';
import {
  RegistroCierreDiario,
  ResultadoCierreDiario,
  EstadoCierreDiario,
  SnapshotInventarioDiario,
  VentaProductoDiaria,
  ReporteDiario,
  ProductoAgotadoDiario,
} from './models/cierre-diario.model';
import { CierreDiarioService } from './services/cierre-diario.service';

interface ReportMetric {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}

interface OrderStatusMetric {
  label: string;
  value: number;
  icon: string;
}

const INVENTORY_PAGE_SIZE = 5;
const SOLD_PRODUCTS_PAGE_SIZE = 5;
const DAILY_CLOSE_REALTIME_REFRESH_DELAY_MS = 2500;
const DAILY_CLOSE_REALTIME_REFRESH_TYPES = new Set([
  'DAILY_REPORT_CHANGED',
]);

@Component({
  selector: 'app-daily-close-page',
  templateUrl: './cierre-diario.page.html',
  styleUrl: './cierre-diario.page.css',
  imports: [ NgClass, NavbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CierreDiarioPage implements OnInit, OnDestroy {
  private readonly dailyCloseService = inject(CierreDiarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toastService = inject(ToastService);
  private readonly inventoryRealtimeService = inject(InventarioRealtimeService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  protected readonly buffetId = signal<string | null>(null);
  protected readonly selectedDate = signal(this.getTodayInputDate());
  protected readonly report = signal<ReporteDiario | null>(null);
  protected readonly closeStatus = signal<EstadoCierreDiario | null>(null);
  protected readonly closeResult = signal<ResultadoCierreDiario | null>(null);
  protected readonly dailyCloses = signal<RegistroCierreDiario[]>([]);
  protected readonly loadingReport = signal(false);
  protected readonly loadingCloseStatus = signal(false);
  protected readonly loadingHistory = signal(false);
  protected readonly closingDay = signal(false);
  protected readonly downloadingCsv = signal(false);
  protected readonly refreshingAfterClose = signal(false);
  protected readonly confirmModalOpen = signal(false);
  protected readonly historyModalOpen = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly closeStatusErrorMessage = signal<string | null>(null);
  protected readonly historyErrorMessage = signal<string | null>(null);
  protected readonly historyFrom = signal('');
  protected readonly historyTo = signal('');
  protected readonly inventoryPage = signal(1);
  protected readonly soldProductsPage = signal(1);

  private realtimeAbortController: AbortController | null = null;
  private realtimeRefreshTimeoutId: number | null = null;

  protected readonly isClosedConfirmed = computed(
    () => this.closeStatus()?.closed === true || this.closeResult() !== null,
  );

  protected readonly statusLabel = computed(() =>
    this.loadingCloseStatus()
      ? 'Verificando'
      : this.isClosedConfirmed()
        ? 'Día cerrado'
        : 'Abierto',
  );

  protected readonly statusDetail = computed(() => {
    if (this.loadingCloseStatus()) {
      return 'Consultando estado del cierre.';
    }

    if (this.closeStatusErrorMessage()) {
      return this.closeStatusErrorMessage();
    }

    if (this.isClosedConfirmed()) {
      return `Cierre confirmado para ${this.formatDate(this.closedSummary()?.date ?? this.selectedDate())}.`;
    }

    return 'Todavía no se hizo un cierre para esta fecha.';
  });

  protected readonly historySearchDisabled = computed(
    () =>
      this.loadingHistory()
      || !this.buffetId()
      || !this.historyFrom()
      || !this.historyTo()
      || this.hasInvalidHistoryDateRange(),
  );

  protected readonly summaryMetrics = computed<ReportMetric[]>(() => {
    const report = this.report();
    if (!report) return [];

    return [
      {
        label: 'Total vendido',
        value: this.formatMoney(report.deliveredTotal),
        tone: 'success',
      },
      { label: 'Pedidos totales', value: this.formatNumber(report.totalOrders) },
      {
        label: 'Entregados',
        value: this.formatNumber(report.deliveredOrders),
        tone: 'success',
      },
      {
        label: 'Vencidos',
        value: this.formatNumber(report.expiredOrders),
        tone: report.expiredOrders > 0 ? 'warning' : undefined,
      },
      {
        label: 'Reservas liberadas',
        value: this.formatNumber(report.releasedReservations),
      },
      {
        label: 'Créditos devueltos',
        value: this.formatMoney(report.refundedCredits),
      },
    ];
  });

  protected readonly orderStatusMetrics = computed<OrderStatusMetric[]>(() => {
    const report = this.report();
    if (!report) return [];

    return [
      { label: 'Entregados', value: report.deliveredOrders, icon: 'fa-check' },
      { label: 'Pendientes', value: report.pendingOrders, icon: 'fa-hourglass-half' },
      {
        label: 'En preparación',
        value: report.inPreparationOrders,
        icon: 'fa-utensils',
      },
      { label: 'Listos', value: report.readyOrders, icon: 'fa-bell-concierge' },
      { label: 'Vencidos', value: report.expiredOrders, icon: 'fa-clock' },
      { label: 'Cancelados', value: report.cancelledOrders, icon: 'fa-ban' },
      { label: 'Rechazados', value: report.rejectedOrders, icon: 'fa-circle-xmark' },
    ];
  });

  protected readonly closureMetrics = computed<ReportMetric[]>(() => {
    const summary = this.closedSummary();
    if (!summary) return [];

    const metrics: ReportMetric[] = [
      {
        label: 'Pedidos vencidos',
        value: this.formatNumber(summary.expiredPurchases),
        tone: summary.expiredPurchases > 0 ? 'warning' : undefined,
      },
      {
        label: 'Reservas liberadas',
        value: this.formatNumber(summary.releasedReservations),
      },
      {
        label: 'Créditos devueltos',
        value: this.formatMoney(summary.refundedCredits),
      },
    ];

    const report = this.report();
    if (report) {
      metrics.push({
        label: 'Total vendido',
        value: this.formatMoney(report.deliveredTotal),
        tone: 'success',
      });
    }

    return metrics;
  });

  protected readonly sortedInventory = computed<SnapshotInventarioDiario[]>(() => {
    const inventory = this.report()?.inventory ?? [];

    return [...inventory].sort((first, second) => {
      const priorityDiff = this.getInventoryPriority(first) - this.getInventoryPriority(second);

      if (priorityDiff !== 0) return priorityDiff;

      return first.productName.localeCompare(second.productName, 'es-AR');
    });
  });

  protected readonly sortedProducts = computed<VentaProductoDiaria[]>(() => {
    const products = this.report()?.products ?? [];

    return [...products].sort((first, second) => {
      const totalDiff = second.total - first.total;

      if (totalDiff !== 0) return totalDiff;

      const quantityDiff = second.quantity - first.quantity;

      if (quantityDiff !== 0) return quantityDiff;

      return first.productName.localeCompare(second.productName, 'es-AR');
    });
  });

  protected readonly paginatedProducts = computed<VentaProductoDiaria[]>(() => {
    const start = (this.soldProductsPage() - 1) * SOLD_PRODUCTS_PAGE_SIZE;

    return this.sortedProducts().slice(start, start + SOLD_PRODUCTS_PAGE_SIZE);
  });

  protected readonly soldProductsTotalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.sortedProducts().length / SOLD_PRODUCTS_PAGE_SIZE),
    ),
  );

  protected readonly soldProductsPageStart = computed(() => {
    if (this.sortedProducts().length === 0) return 0;

    return (this.soldProductsPage() - 1) * SOLD_PRODUCTS_PAGE_SIZE + 1;
  });

  protected readonly soldProductsPageEnd = computed(() =>
    Math.min(
      this.soldProductsPage() * SOLD_PRODUCTS_PAGE_SIZE,
      this.sortedProducts().length,
    ),
  );

  protected readonly paginatedInventory = computed<SnapshotInventarioDiario[]>(() => {
    const start = (this.inventoryPage() - 1) * INVENTORY_PAGE_SIZE;

    return this.sortedInventory().slice(start, start + INVENTORY_PAGE_SIZE);
  });

  protected readonly inventoryTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedInventory().length / INVENTORY_PAGE_SIZE)),
  );

  protected readonly inventoryPageStart = computed(() => {
    if (this.sortedInventory().length === 0) return 0;

    return (this.inventoryPage() - 1) * INVENTORY_PAGE_SIZE + 1;
  });

  protected readonly inventoryPageEnd = computed(() =>
    Math.min(
      this.inventoryPage() * INVENTORY_PAGE_SIZE,
      this.sortedInventory().length,
    ),
  );

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');

    const buffetId = this.perfilService.obtenerBuffetId();
    this.buffetId.set(buffetId);

    if (!buffetId) {
      this.errorMessage.set('No se encontró un buffet asociado a tu perfil.');
      return;
    }

    this.loadDailyData();
    this.loadCloseHistory();
    this.connectRealtime(buffetId);
  }

  ngOnDestroy(): void {
    this.realtimeAbortController?.abort();

    if (this.realtimeRefreshTimeoutId !== null) {
      window.clearTimeout(this.realtimeRefreshTimeoutId);
    }
  }

  protected volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  protected onDateChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const nextDate = target?.value;

    if (!nextDate || nextDate === this.selectedDate()) {
      return;
    }

    this.selectedDate.set(nextDate);
    this.closeResult.set(null);
    this.closeStatus.set(null);
    this.closeStatusErrorMessage.set(null);
    this.inventoryPage.set(1);
    this.soldProductsPage.set(1);
    this.loadDailyData();
  }

  protected loadDailyData(showLoading = true): void {
    this.loadCloseStatus(showLoading);
    this.loadReport(showLoading);
  }

  protected loadReport(showLoading = true): void {
    const buffetId = this.buffetId();
    if (!buffetId) return;

    if (showLoading) {
      this.loadingReport.set(true);
      this.errorMessage.set(null);
    }

    this.dailyCloseService
      .getReporteDiario(buffetId, this.selectedDate())
      .pipe(finalize(() => {
        if (showLoading) {
          this.loadingReport.set(false);
        }
      }))
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.inventoryPage.set(1);
          this.soldProductsPage.set(1);
        },
        error: () => {
          if (showLoading) {
            this.report.set(null);
            this.errorMessage.set('No se pudo cargar el reporte diario.');
          }
        },
      });
  }

  protected loadCloseStatus(showLoading = true): void {
    const buffetId = this.buffetId();
    if (!buffetId) return;

    if (showLoading) {
      this.loadingCloseStatus.set(true);
      this.closeStatusErrorMessage.set(null);
    }

    this.dailyCloseService
      .getEstadoCierreDiario(buffetId, this.selectedDate())
      .pipe(finalize(() => {
        if (showLoading) {
          this.loadingCloseStatus.set(false);
        }
      }))
      .subscribe({
        next: (status) => {
          this.closeStatus.set(status);
        },
        error: () => {
          if (showLoading) {
            this.closeStatus.set(null);
            this.closeStatusErrorMessage.set(
              'No se pudo verificar si esta fecha ya fue cerrada.',
            );
          }
        },
      });
  }

  protected loadCloseHistory(): void {
    const buffetId = this.buffetId();
    if (!buffetId) return;

    this.loadingHistory.set(true);
    this.historyErrorMessage.set(null);

    this.dailyCloseService
      .getDailyCloses(buffetId, {
        from: this.historyFrom() || undefined,
        to: this.historyTo() || undefined,
      })
      .pipe(finalize(() => this.loadingHistory.set(false)))
      .subscribe({
        next: (closes) => {
          this.dailyCloses.set(closes);
        },
        error: () => {
          this.dailyCloses.set([]);
          this.historyErrorMessage.set('No se pudieron cargar los cierres.');
        },
      });
  }

  protected searchCloseHistory(): void {
    if (!this.historyFrom() || !this.historyTo()) {
      this.historyErrorMessage.set('Ingresá fecha desde y hasta para buscar cierres.');
      return;
    }

    if (this.hasInvalidHistoryDateRange()) {
      this.historyErrorMessage.set('La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }

    this.loadCloseHistory();
  }

  protected openHistoryModal(): void {
    this.historyModalOpen.set(true);
    this.loadCloseHistory();
  }

  protected closeHistoryModal(): void {
    this.historyModalOpen.set(false);
  }

  protected onHistoryFromChange(event: Event): void {
    this.historyFrom.set(this.getInputValue(event));
    this.validateHistoryDateRange();
  }

  protected onHistoryToChange(event: Event): void {
    this.historyTo.set(this.getInputValue(event));
    this.validateHistoryDateRange();
  }

  private validateHistoryDateRange(): void {
    if (!this.historyFrom() || !this.historyTo()) {
      this.historyErrorMessage.set(null);
      return;
    }

    this.historyErrorMessage.set(
      this.hasInvalidHistoryDateRange()
        ? 'La fecha desde no puede ser posterior a la fecha hasta.'
        : null,
    );
  }

  private hasInvalidHistoryDateRange(): boolean {
    const from = this.historyFrom();
    const to = this.historyTo();
    return !!from && !!to && from > to;
  }

  protected selectDailyClose(close: RegistroCierreDiario): void {
    this.selectedDate.set(close.date);
    this.closeResult.set(null);
    this.inventoryPage.set(1);
    this.soldProductsPage.set(1);
    this.closeStatus.set({
      buffetId: close.buffetId,
      date: close.date,
      closed: true,
      expiredPurchases: close.expiredPurchases,
      releasedReservations: close.releasedReservations,
      refundedCredits: close.refundedCredits,
    });
    this.closeStatusErrorMessage.set(null);
    this.historyModalOpen.set(false);
    this.loadDailyData();
  }

  protected openConfirmModal(): void {
    if (this.closingDay() || this.loadingCloseStatus() || this.isClosedConfirmed()) {
      return;
    }

    this.confirmModalOpen.set(true);
  }

  protected closeConfirmModal(): void {
    if (this.closingDay()) {
      return;
    }

    this.confirmModalOpen.set(false);
  }

  protected confirmDailyClose(): void {
    const buffetId = this.buffetId();
    if (
      !buffetId ||
      this.closingDay() ||
      this.loadingCloseStatus() ||
      this.isClosedConfirmed()
    ) {
      return;
    }

    this.closingDay.set(true);
    this.errorMessage.set(null);

    this.dailyCloseService
      .closeDaily(buffetId, this.selectedDate())
      .pipe(finalize(() => this.closingDay.set(false)))
      .subscribe({
        next: (result) => {
          this.closeResult.set(result);
          this.report.set(result.report);
          this.inventoryPage.set(1);
          this.soldProductsPage.set(1);
          this.closeStatus.set(this.resultToCloseStatus(result));
          this.confirmModalOpen.set(false);
          this.toastService.mostrar(
            result.alreadyClosed
              ? 'El día ya estaba cerrado.'
              : 'Cierre diario realizado.',
            result.alreadyClosed ? 'info' : 'success',
          );
          this.loadCloseHistory();
          if (result.alreadyClosed) {
            this.loadCloseStatus();
          }
          this.refreshAfterClose(buffetId);
        },
        error: () => {
          this.toastService.mostrar('No se pudo cerrar el día.', 'error');
        },
      });
  }

  protected downloadCsv(): void {
    const buffetId = this.buffetId();
    if (!buffetId || this.downloadingCsv()) {
      return;
    }

    this.downloadingCsv.set(true);

    this.dailyCloseService
      .downloadReporteDiarioCsv(buffetId, this.selectedDate())
      .pipe(finalize(() => this.downloadingCsv.set(false)))
      .subscribe({
        next: (file) => {
          this.saveCsvFile(file, `daily-report-${this.selectedDate()}.csv`);
        },
        error: () => {
          this.toastService.mostrar('No se pudo descargar el CSV.', 'error');
        },
      });
  }

  protected formatMoney(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  protected formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR').format(Number(value ?? 0));
  }

  protected formatOptionalNumber(value: number | null | undefined): string {
    return value === null || value === undefined
      ? 'Sin mínimo'
      : this.formatNumber(value);
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '-';

    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;

    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  protected formatInventoryStatus(status: string): string {
    const labels: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      BAJO_STOCK: 'Bajo stock',
      SIN_STOCK: 'Agotado',
      DESACTIVADO: 'Pausado',
    };

    return labels[status] ?? status;
  }

  protected formatInventoryMode(mode: string): string {
    const labels: Record<string, string> = {
      STOCK_EXACTO: 'Stock exacto',
      DISPONIBLE_NO_DISPONIBLE: 'Disponible / no disponible',
      CUPO_DIARIO: 'Cupo diario',
    };

    return labels[mode] ?? mode;
  }

  protected formatMovementType(movementType: string): string {
    const labels: Record<string, string> = {
      AJUSTE: 'Ajuste',
      LIBERACION: 'Liberación',
      RESERVA: 'Reserva',
      VENTA: 'Venta',
      CONSUMO: 'Consumo',
    };

    if (labels[movementType]) {
      return labels[movementType];
    }

    const normalized = movementType
      .replace(/_/g, ' ')
      .toLocaleLowerCase('es-AR');

    return normalized.charAt(0).toLocaleUpperCase('es-AR') + normalized.slice(1);
  }

  protected soldOutProductName(product: ProductoAgotadoDiario): string {
    return product.productName ?? product.nombre ?? 'Producto agotado';
  }

  protected isInventorySoldOut(product: SnapshotInventarioDiario): boolean {
    return product.estadoInventario === 'SIN_STOCK';
  }

  protected isInventoryLowStock(product: SnapshotInventarioDiario): boolean {
    return product.estadoInventario === 'BAJO_STOCK';
  }

  protected isSoldProductSoldOut(product: VentaProductoDiaria): boolean {
    return this.findInventorySnapshot(product.productId)?.estadoInventario === 'SIN_STOCK';
  }

  protected isSoldProductLowStock(product: VentaProductoDiaria): boolean {
    return this.findInventorySnapshot(product.productId)?.estadoInventario === 'BAJO_STOCK';
  }

  protected trackProductSale(_: number, product: { productId: string }): string {
    return product.productId;
  }

  protected trackInventory(_: number, product: SnapshotInventarioDiario): string {
    return product.productId;
  }

  protected trackDailyClose(_: number, close: RegistroCierreDiario): string {
    return close.id;
  }

  protected isSelectedClose(close: RegistroCierreDiario): boolean {
    return close.date === this.selectedDate();
  }

  protected previousInventoryPage(): void {
    this.inventoryPage.update((page) => Math.max(1, page - 1));
  }

  protected nextInventoryPage(): void {
    this.inventoryPage.update((page) =>
      Math.min(this.inventoryTotalPages(), page + 1),
    );
  }

  protected previousSoldProductsPage(): void {
    this.soldProductsPage.update((page) => Math.max(1, page - 1));
  }

  protected nextSoldProductsPage(): void {
    this.soldProductsPage.update((page) =>
      Math.min(this.soldProductsTotalPages(), page + 1),
    );
  }

  private refreshAfterClose(buffetId: string): void {
    this.refreshingAfterClose.set(true);

    this.dailyCloseService
      .refreshAfterClose(buffetId, this.selectedDate())
      .pipe(finalize(() => this.refreshingAfterClose.set(false)))
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.inventoryPage.set(1);
          this.soldProductsPage.set(1);
        },
        error: () => {
          this.toastService.mostrar(
            'El cierre se realizó, pero no se pudo refrescar el reporte.',
            'error',
          );
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
          console.warn('SSE de cierre diario desconectado o reintentando', error);
        },
      },
    );
  }

  private scheduleRealtimeRefresh(event: EventoInventarioRealtime): void {
    if (
      !this.shouldRefreshDailyCloseForRealtimeEvent(event) ||
      this.realtimeRefreshTimeoutId !== null
    ) {
      return;
    }

    this.realtimeRefreshTimeoutId = window.setTimeout(() => {
      this.realtimeRefreshTimeoutId = null;

      if (!this.shouldRefreshDailyCloseForRealtimeEvent(event)) {
        return;
      }

      this.inventoryRealtimeService.recordRefetch('daily-close-report');
      this.loadDailyData(false);

      if (this.historyModalOpen()) {
        this.loadCloseHistory();
      }
    }, DAILY_CLOSE_REALTIME_REFRESH_DELAY_MS);
  }

  private findInventorySnapshot(productId: string): SnapshotInventarioDiario | undefined {
    return this.report()?.inventory.find((item) => item.productId === productId);
  }

  private getInventoryPriority(product: SnapshotInventarioDiario): number {
    return this.getInventoryStatusPriority(product.estadoInventario);
  }

  private getInventoryStatusPriority(status: string | undefined): number {
    const priorities: Record<string, number> = {
      SIN_STOCK: 0,
      BAJO_STOCK: 1,
      DISPONIBLE: 2,
      DESACTIVADO: 3,
    };

    return status ? priorities[status] ?? 4 : 4;
  }

  private closedSummary(): EstadoCierreDiario | null {
    const status = this.closeStatus();
    if (status?.closed) return status;

    const result = this.closeResult();
    if (!result) return null;

    return this.resultToCloseStatus(result);
  }

  private resultToCloseStatus(result: ResultadoCierreDiario): EstadoCierreDiario {
    return {
      buffetId: result.report.buffetId,
      date: result.report.date,
      closed: true,
      expiredPurchases: result.expiredPurchases,
      releasedReservations: result.releasedReservations,
      refundedCredits: result.refundedCredits,
    };
  }

  private saveCsvFile(file: Blob, filename: string): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? '';
  }

  private isSelectedDateToday(): boolean {
    return this.selectedDate() === this.getTodayInputDate();
  }

  private shouldRefreshDailyCloseForRealtimeEvent(
    event: EventoInventarioRealtime,
  ): boolean {
    return (
      document.visibilityState === 'visible' &&
      this.isRealtimeEventForSelectedDate(event) &&
      !this.isClosedConfirmed() &&
      DAILY_CLOSE_REALTIME_REFRESH_TYPES.has(event.type)
    );
  }

  private isRealtimeEventForSelectedDate(event: EventoInventarioRealtime): boolean {
    const eventDate = event.date?.trim();

    if (eventDate) {
      return eventDate === this.selectedDate();
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
}
