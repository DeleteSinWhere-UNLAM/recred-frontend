import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import {
  DailyCloseResult,
  DailyInventorySnapshot,
  DailyProductSale,
  DailyReport,
  DailySoldOutProduct,
} from './models/daily-close.model';
import { DailyCloseService } from './services/daily-close.service';

interface ReportMetric {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'danger';
}

interface OrderStatusMetric {
  label: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'app-daily-close-page',
  templateUrl: './daily-close.page.html',
  styleUrl: './daily-close.page.css',
  imports: [NavbarComponent, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyClosePage implements OnInit {
  private readonly dailyCloseService = inject(DailyCloseService);
  private readonly perfilService = inject(PerfilService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly buffetId = signal<string | null>(null);
  protected readonly selectedDate = signal(this.getTodayInputDate());
  protected readonly report = signal<DailyReport | null>(null);
  protected readonly closeResult = signal<DailyCloseResult | null>(null);
  protected readonly loadingReport = signal(false);
  protected readonly closingDay = signal(false);
  protected readonly downloadingCsv = signal(false);
  protected readonly refreshingAfterClose = signal(false);
  protected readonly confirmModalOpen = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly isClosedConfirmed = computed(() => this.closeResult() !== null);

  protected readonly statusLabel = computed(() =>
    this.isClosedConfirmed() ? 'Cerrado' : 'Abierto',
  );

  protected readonly statusDetail = computed(() =>
    this.isClosedConfirmed()
      ? 'Cierre confirmado para la fecha seleccionada.'
      : 'Aún no se ha hecho un cierre.',
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
        label: 'Creditos devueltos',
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
        label: 'En preparacion',
        value: report.inPreparationOrders,
        icon: 'fa-utensils',
      },
      { label: 'Listos', value: report.readyOrders, icon: 'fa-bell-concierge' },
      { label: 'Vencidos', value: report.expiredOrders, icon: 'fa-clock' },
      { label: 'Cancelados', value: report.cancelledOrders, icon: 'fa-ban' },
      { label: 'Rechazados', value: report.rejectedOrders, icon: 'fa-circle-xmark' },
    ];
  });

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');

    const buffetId = this.perfilService.obtenerBuffetId();
    this.buffetId.set(buffetId);

    if (!buffetId) {
      this.errorMessage.set('No se encontro un buffet asociado a tu perfil.');
      return;
    }

    this.loadReport();
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
    this.loadReport();
  }

  protected loadReport(): void {
    const buffetId = this.buffetId();
    if (!buffetId) return;

    this.loadingReport.set(true);
    this.errorMessage.set(null);

    this.dailyCloseService
      .getDailyReport(buffetId, this.selectedDate())
      .pipe(finalize(() => this.loadingReport.set(false)))
      .subscribe({
        next: (report) => {
          this.report.set(report);
        },
        error: () => {
          this.report.set(null);
          this.errorMessage.set('No se pudo cargar el reporte diario.');
        },
      });
  }

  protected openConfirmModal(): void {
    if (this.closingDay() || this.isClosedConfirmed()) {
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
    if (!buffetId || this.closingDay() || this.isClosedConfirmed()) {
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
          this.confirmModalOpen.set(false);
          this.toastService.mostrar(
            result.alreadyClosed
              ? 'El dia ya estaba cerrado.'
              : 'Cierre diario realizado.',
            result.alreadyClosed ? 'info' : 'success',
          );
          this.refreshAfterClose(buffetId);
        },
        error: () => {
          this.toastService.mostrar('No se pudo cerrar el dia.', 'error');
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
      .downloadDailyReportCsv(buffetId, this.selectedDate())
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
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  protected formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR').format(Number(value ?? 0));
  }

  protected formatOptionalNumber(value: number | null | undefined): string {
    return value === null || value === undefined
      ? 'Sin minimo'
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

  protected formatPaymentMethod(paymentMethod: string): string {
    return paymentMethod.replace(/_/g, ' ').toLocaleLowerCase('es-AR');
  }

  protected formatMovementType(movementType: string): string {
    return movementType.replace(/_/g, ' ').toLocaleLowerCase('es-AR');
  }

  protected soldOutProductName(product: DailySoldOutProduct): string {
    return product.productName ?? product.nombre ?? 'Producto agotado';
  }

  protected isInventorySoldOut(product: DailyInventorySnapshot): boolean {
    return product.estadoInventario === 'SIN_STOCK';
  }

  protected isInventoryLowStock(product: DailyInventorySnapshot): boolean {
    return product.estadoInventario === 'BAJO_STOCK';
  }

  protected isSoldProductSoldOut(product: DailyProductSale): boolean {
    return this.findInventorySnapshot(product.productId)?.estadoInventario === 'SIN_STOCK';
  }

  protected isSoldProductLowStock(product: DailyProductSale): boolean {
    return this.findInventorySnapshot(product.productId)?.estadoInventario === 'BAJO_STOCK';
  }

  protected trackProductSale(_: number, product: { productId: string }): string {
    return product.productId;
  }

  protected trackInventory(_: number, product: DailyInventorySnapshot): string {
    return product.productId;
  }

  private refreshAfterClose(buffetId: string): void {
    this.refreshingAfterClose.set(true);

    this.dailyCloseService
      .refreshAfterClose(buffetId, this.selectedDate())
      .pipe(finalize(() => this.refreshingAfterClose.set(false)))
      .subscribe({
        next: (report) => {
          this.report.set(report);
        },
        error: () => {
          this.toastService.mostrar(
            'El cierre se realizo, pero no se pudo refrescar el reporte.',
            'error',
          );
        },
      });
  }

  private findInventorySnapshot(productId: string): DailyInventorySnapshot | undefined {
    return this.report()?.inventory.find((item) => item.productId === productId);
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

  private getTodayInputDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
