import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  DailyCloseRecord,
  DailyCloseResult,
  DailyCloseStatus,
  DailyInventorySnapshot,
  DailyProductSale,
  DailyReport,
} from './models/daily-close.model';
import { DailyClosePage } from './daily-close.page';
import { DailyCloseService } from './services/daily-close.service';
import { InventoryRealtimeService } from '../updated-inventory/services/inventory-realtime.service';
import { RealtimeInventoryEvent } from '../updated-inventory/models/inventory.interface';

type TestSignal<T> = {
  (): T;
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
};

interface DailyClosePageTestApi {
  readonly buffetId: TestSignal<string | null>;
  readonly selectedDate: TestSignal<string>;
  readonly report: TestSignal<DailyReport | null>;
  readonly closeStatus: TestSignal<DailyCloseStatus | null>;
  readonly closeResult: TestSignal<DailyCloseResult | null>;
  readonly dailyCloses: TestSignal<DailyCloseRecord[]>;
  readonly closingDay: TestSignal<boolean>;
  readonly loadingCloseStatus: TestSignal<boolean>;
  readonly confirmModalOpen: TestSignal<boolean>;
  readonly historyModalOpen: TestSignal<boolean>;
  readonly historyFrom: TestSignal<string>;
  readonly historyTo: TestSignal<string>;
  readonly inventoryPage: TestSignal<number>;
  readonly soldProductsPage: TestSignal<number>;
  readonly summaryMetrics: () => Array<{ label: string; value: string; tone?: string }>;
  readonly orderStatusMetrics: () => Array<{ label: string; value: number; icon: string }>;
  readonly closureMetrics: () => Array<{ label: string; value: string; tone?: string }>;
  readonly sortedInventory: () => DailyInventorySnapshot[];
  readonly sortedProducts: () => DailyProductSale[];
  readonly closeStatusErrorMessage: TestSignal<string | null>;
  readonly errorMessage: TestSignal<string | null>;
  readonly historyErrorMessage: TestSignal<string | null>;
  readonly refreshingAfterClose: TestSignal<boolean>;
  volver: () => void;
  onDateChange: (event: Event) => void;
  loadCloseStatus: (showLoading?: boolean) => void;
  loadCloseHistory: () => void;
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
  onHistoryFromChange: (event: Event) => void;
  onHistoryToChange: (event: Event) => void;
  selectDailyClose: (close: DailyCloseRecord) => void;
  openConfirmModal: () => void;
  closeConfirmModal: () => void;
  confirmDailyClose: () => void;
  downloadCsv: () => void;
  formatMoney: (value: number | null | undefined) => string;
  formatNumber: (value: number | null | undefined) => string;
  formatOptionalNumber: (value: number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  formatInventoryStatus: (status: string) => string;
  formatInventoryMode: (mode: string) => string;
  formatMovementType: (movementType: string) => string;
  soldOutProductName: (product: { productName?: string; nombre?: string }) => string;
  isInventorySoldOut: (product: DailyInventorySnapshot) => boolean;
  isInventoryLowStock: (product: DailyInventorySnapshot) => boolean;
  isSoldProductSoldOut: (product: DailyProductSale) => boolean;
  isSoldProductLowStock: (product: DailyProductSale) => boolean;
  trackProductSale: (_: number, product: { productId: string }) => string;
  trackInventory: (_: number, product: DailyInventorySnapshot) => string;
  trackDailyClose: (_: number, close: DailyCloseRecord) => string;
  isSelectedClose: (close: DailyCloseRecord) => boolean;
  previousInventoryPage: () => void;
  nextInventoryPage: () => void;
  previousSoldProductsPage: () => void;
  nextSoldProductsPage: () => void;
}

describe('DailyClosePage', () => {
  let component: DailyClosePage;
  let fixture: ComponentFixture<DailyClosePage>;
  let dailyCloseService: jasmine.SpyObj<DailyCloseService>;
  let inventoryRealtimeService: jasmine.SpyObj<InventoryRealtimeService>;
  let perfilService: jasmine.SpyObj<PerfilService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: Router;

  const buffetId = 'buffet-123';
  const report: DailyReport = {
    buffetId,
    date: '2026-06-09',
    totalOrders: 25,
    deliveredOrders: 18,
    pendingOrders: 2,
    inPreparationOrders: 1,
    readyOrders: 1,
    expiredOrders: 3,
    cancelledOrders: 0,
    rejectedOrders: 0,
    deliveredTotal: 12500,
    refundedCredits: 0,
    releasedReservations: 8,
    products: [
      {
        productId: 'product-1',
        productName: 'Alfajor',
        quantity: 12,
        total: 6000,
      },
    ],
    inventory: [
      {
        productId: 'product-1',
        productName: 'Alfajor',
        stockActual: 2,
        stockReservado: 0,
        stockDisponible: 2,
        stockMinimo: 3,
        estadoInventario: 'BAJO_STOCK',
        tipoManejoInventario: 'STOCK_EXACTO',
      },
      {
        productId: 'product-2',
        productName: 'Jugo',
        stockActual: 0,
        stockReservado: 0,
        stockDisponible: 0,
        estadoInventario: 'SIN_STOCK',
        tipoManejoInventario: 'STOCK_EXACTO',
      },
    ],
    soldOutProducts: [
      {
        productId: 'product-2',
        productName: 'Jugo',
      },
    ],
    salesByPaymentMethod: [],
    stockMovements: [],
  };

  beforeEach(async () => {
    dailyCloseService = jasmine.createSpyObj<DailyCloseService>(
      'DailyCloseService',
      [
        'getDailyReport',
        'getDailyCloseStatus',
        'getDailyCloses',
        'closeDaily',
        'refreshAfterClose',
        'getDailyReportCsvUrl',
        'downloadDailyReportCsv',
      ],
    );
    inventoryRealtimeService = jasmine.createSpyObj<InventoryRealtimeService>(
      'InventoryRealtimeService',
      ['connect', 'recordRefetch'],
    );
    perfilService = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'obtenerBuffetId',
    ]);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    dailyCloseService.getDailyReport.and.returnValue(of(report));
    inventoryRealtimeService.connect.and.returnValue(new AbortController());
    dailyCloseService.getDailyCloseStatus.and.returnValue(
      of({
        buffetId,
        date: report.date,
        closed: false,
        expiredPurchases: 0,
        releasedReservations: 0,
        refundedCredits: 0,
      }),
    );
    dailyCloseService.getDailyCloses.and.returnValue(
      of([
        {
          id: 'close-1',
          buffetId,
          date: report.date,
          expiredPurchases: 3,
          releasedReservations: 8,
          refundedCredits: 0,
        },
      ]),
    );
    dailyCloseService.closeDaily.and.returnValue(
      of({
        alreadyClosed: false,
        expiredPurchases: 3,
        releasedReservations: 8,
        refundedCredits: 0,
        report,
      }),
    );
    dailyCloseService.refreshAfterClose.and.returnValue(of(report));
    dailyCloseService.getDailyReportCsvUrl.and.returnValue('/daily.csv');
    dailyCloseService.downloadDailyReportCsv.and.returnValue(
      of(new Blob(['metric,value'], { type: 'text/csv' })),
    );
    perfilService.obtenerBuffetId.and.returnValue(buffetId);

    await TestBed.configureTestingModule({
      imports: [DailyClosePage],
      providers: [
        { provide: DailyCloseService, useValue: dailyCloseService },
        { provide: InventoryRealtimeService, useValue: inventoryRealtimeService },
        { provide: PerfilService, useValue: perfilService },
        { provide: ToastService, useValue: toastService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyClosePage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  function page(): DailyClosePageTestApi {
    return component as unknown as DailyClosePageTestApi;
  }

  function inputEvent(value: string): Event {
    const input = document.createElement('input');
    input.value = value;
    const event = new Event('change');
    Object.defineProperty(event, 'target', {
      configurable: true,
      value: input,
    });
    return event;
  }

  it('deberia cargar el reporte diario al iniciar', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(dailyCloseService.getDailyReport).toHaveBeenCalledWith(
      buffetId,
      jasmine.any(String),
    );
    expect(dailyCloseService.getDailyCloseStatus).toHaveBeenCalledWith(
      buffetId,
      jasmine.any(String),
    );
    expect(dailyCloseService.getDailyCloses).toHaveBeenCalledWith(buffetId, {
      from: undefined,
      to: undefined,
    });
    expect(fixture.nativeElement.textContent).toContain('Cierre diario');
    expect(fixture.nativeElement.textContent).toContain('Historial de cierres');
    expect(compiled.querySelector('.daily-close__controls')).toBeNull();
    expect(
      compiled.querySelector('.daily-close-hero__date input[type="date"]'),
    ).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Alfajor');
    expect(fixture.nativeElement.textContent).not.toContain('2026-06-09');
    expect(fixture.nativeElement.textContent).toContain('Mínimo 3');
    expect(fixture.nativeElement.textContent).toContain('Sin mínimo');
  });

  it('deberia marcar productos agotados y bajo stock con clases operativas', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.dc-inventory-row--low-stock')).toBeTruthy();
    expect(compiled.querySelector('.dc-inventory-row--sold-out')).toBeTruthy();
    expect(compiled.querySelector('.dc-inventory-status--low-stock')).toBeTruthy();
    expect(compiled.querySelector('.dc-inventory-status--sold-out')).toBeTruthy();
  });

  it('deberia ordenar el inventario dejando agotados y bajo stock primero', () => {
    dailyCloseService.getDailyReport.and.returnValue(
      of({
        ...report,
        inventory: [
          {
            productId: 'product-available',
            productName: 'Agua',
            stockActual: 20,
            stockReservado: 0,
            stockDisponible: 20,
            estadoInventario: 'DISPONIBLE',
            tipoManejoInventario: 'STOCK_EXACTO',
          },
          {
            productId: 'product-sold-out',
            productName: 'Jugo',
            stockActual: 0,
            stockReservado: 0,
            stockDisponible: 0,
            estadoInventario: 'SIN_STOCK',
            tipoManejoInventario: 'STOCK_EXACTO',
          },
          {
            productId: 'product-low',
            productName: 'Barrita',
            stockActual: 1,
            stockReservado: 0,
            stockDisponible: 1,
            stockMinimo: 5,
            estadoInventario: 'BAJO_STOCK',
            tipoManejoInventario: 'STOCK_EXACTO',
          },
        ],
      }),
    );

    fixture.detectChanges();

    const firstInventoryName = (
      fixture.nativeElement as HTMLElement
    ).querySelector('.dc-inventory-product strong')?.textContent;

    expect(firstInventoryName).toContain('Jugo');
  });

  it('deberia ordenar productos vendidos de mayor a menor por importe', () => {
    dailyCloseService.getDailyReport.and.returnValue(
      of({
        ...report,
        products: [
          {
            productId: 'product-available',
            productName: 'Agua',
            quantity: 4,
            total: 2000,
          },
          {
            productId: 'product-low',
            productName: 'Barrita',
            quantity: 3,
            total: 3500,
          },
          {
            productId: 'product-sold-out',
            productName: 'Jugo',
            quantity: 2,
            total: 1000,
          },
        ],
        inventory: [
          {
            productId: 'product-available',
            productName: 'Agua',
            stockActual: 20,
            stockReservado: 0,
            stockDisponible: 20,
            estadoInventario: 'DISPONIBLE',
            tipoManejoInventario: 'STOCK_EXACTO',
          },
          {
            productId: 'product-low',
            productName: 'Barrita',
            stockActual: 1,
            stockReservado: 0,
            stockDisponible: 1,
            stockMinimo: 5,
            estadoInventario: 'BAJO_STOCK',
            tipoManejoInventario: 'STOCK_EXACTO',
          },
          {
            productId: 'product-sold-out',
            productName: 'Jugo',
            stockActual: 0,
            stockReservado: 0,
            stockDisponible: 0,
            estadoInventario: 'SIN_STOCK',
            tipoManejoInventario: 'STOCK_EXACTO',
          },
        ],
      }),
    );

    fixture.detectChanges();

    const productNames = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.dc-sold-product-info strong',
      ),
    ).map((element) => element.textContent?.trim());

    expect(productNames).toEqual(['Barrita', 'Agua', 'Jugo']);
  });

  it('deberia paginar productos vendidos en el frente', () => {
    const products = Array.from({ length: 6 }, (_, index) => ({
      productId: `sold-product-${index + 1}`,
      productName: `Producto vendido ${index + 1}`,
      quantity: index + 1,
      total: (index + 1) * 1000,
    }));

    dailyCloseService.getDailyReport.and.returnValue(
      of({
        ...report,
        products,
      }),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1-5 de 6 productos');
    expect(fixture.nativeElement.textContent).toContain('Producto vendido 6');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Producto vendido 1',
    );

    (
      component as unknown as { nextSoldProductsPage: () => void }
    ).nextSoldProductsPage();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('6-6 de 6 productos');
    expect(fixture.nativeElement.textContent).toContain('Producto vendido 1');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Producto vendido 6',
    );
  });

  it('deberia paginar el inventario en el frente', () => {
    const inventory = Array.from({ length: 6 }, (_, index) => ({
      productId: `product-${index + 1}`,
      productName: `Producto ${index + 1}`,
      stockActual: 10,
      stockReservado: 0,
      stockDisponible: 10,
      estadoInventario: 'DISPONIBLE',
      tipoManejoInventario: 'STOCK_EXACTO',
    }));

    dailyCloseService.getDailyReport.and.returnValue(
      of({
        ...report,
        inventory,
      }),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1-5 de 6');
    expect(fixture.nativeElement.textContent).toContain('Producto 1');
    expect(fixture.nativeElement.textContent).not.toContain('Producto 6');

    (component as unknown as { nextInventoryPage: () => void }).nextInventoryPage();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('6-6 de 6');
    expect(fixture.nativeElement.textContent).toContain('Producto 6');
    expect(fixture.nativeElement.textContent).not.toContain('Producto 1');
  });

  it('deberia abrir el historial en modal y filtrar por fecha', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const callsBeforeOpen = dailyCloseService.getDailyCloses.calls.count();

    compiled.querySelector<HTMLButtonElement>('.daily-close-hero__secondary')?.click();
    fixture.detectChanges();

    expect(dailyCloseService.getDailyCloses.calls.count()).toBe(callsBeforeOpen + 1);
    expect(compiled.querySelector('.daily-close-modal--history')).toBeTruthy();
    expect(compiled.textContent).toContain('Desde');
    expect(compiled.textContent).toContain('Hasta');

    const [fromInput, toInput] = Array.from(
      compiled.querySelectorAll<HTMLInputElement>(
        '.daily-close-modal--history input[type="date"]',
      ),
    );

    fromInput.value = '2026-06-01';
    fromInput.dispatchEvent(new Event('change'));
    toInput.value = '2026-06-12';
    toInput.dispatchEvent(new Event('change'));

    compiled
      .querySelector<HTMLButtonElement>(
        '.daily-close-modal--history .daily-close__history-filters button',
      )
      ?.click();

    expect(dailyCloseService.getDailyCloses).toHaveBeenCalledWith(buffetId, {
      from: '2026-06-01',
      to: '2026-06-12',
    });
  });

  it('no deberia mostrar ventas por medio de pago en el reporte', () => {
    dailyCloseService.getDailyReport.and.returnValue(
      of({
        ...report,
        salesByPaymentMethod: [
          {
            paymentMethod: 'EFECTIVO',
            orders: 2,
            total: 1500,
          },
        ],
      }),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Ventas por medio de pago');
    expect(fixture.nativeElement.textContent).not.toContain('efectivo');
  });

  it('deberia mostrar movimientos de stock con etiquetas capitalizadas', () => {
    dailyCloseService.getDailyReport.and.returnValue(
      of({
        ...report,
        stockMovements: [
          { movementType: 'AJUSTE', quantity: 117 },
          { movementType: 'LIBERACION', quantity: 4 },
          { movementType: 'RESERVA', quantity: 42 },
          { movementType: 'VENTA', quantity: 27 },
        ],
      }),
    );

    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent as string;
    expect(textContent).toContain('Ajuste');
    expect(textContent).toContain('Liberación');
    expect(textContent).toContain('Reserva');
    expect(textContent).toContain('Venta');
    expect(textContent).not.toContain('liberacion');
  });

  it('deberia avisar y bloquear el cierre si la fecha ya estaba cerrada', () => {
    dailyCloseService.getDailyCloseStatus.and.returnValue(
      of({
        buffetId,
        date: report.date,
        closed: true,
        expiredPurchases: 3,
        releasedReservations: 8,
        refundedCredits: 0,
      }),
    );

    fixture.detectChanges();

    (component as unknown as { confirmDailyClose: () => void }).confirmDailyClose();

    expect(fixture.nativeElement.textContent).toContain('Día cerrado');
    expect(fixture.nativeElement.textContent).toContain('Cierre confirmado');
    expect(dailyCloseService.closeDaily).not.toHaveBeenCalled();
  });

  it('deberia cerrar el día y refrescar datos operativos', () => {
    fixture.detectChanges();

    (component as unknown as { confirmDailyClose: () => void }).confirmDailyClose();

    expect(dailyCloseService.closeDaily).toHaveBeenCalledWith(
      buffetId,
      jasmine.any(String),
    );
    expect(dailyCloseService.refreshAfterClose).toHaveBeenCalledWith(
      buffetId,
      jasmine.any(String),
    );
    expect(toastService.mostrar).toHaveBeenCalledWith(
      'Cierre diario realizado.',
      'success',
    );
  });

  it('deberia descargar el CSV usando el servicio autenticado', () => {
    const createObjectUrlSpy = spyOn(URL, 'createObjectURL').and.returnValue(
      'blob:daily-report',
    );
    const revokeObjectUrlSpy = spyOn(URL, 'revokeObjectURL');
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');

    fixture.detectChanges();

    (component as unknown as { downloadCsv: () => void }).downloadCsv();

    expect(dailyCloseService.downloadDailyReportCsv).toHaveBeenCalledWith(
      buffetId,
      jasmine.any(String),
    );
    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:daily-report');
  });

  it('deberia mostrar mensaje si el día ya estaba cerrado', () => {
    dailyCloseService.closeDaily.and.returnValue(
      of({
        alreadyClosed: true,
        expiredPurchases: 0,
        releasedReservations: 0,
        refundedCredits: 0,
        report,
      }),
    );
    fixture.detectChanges();

    (component as unknown as { confirmDailyClose: () => void }).confirmDailyClose();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El día ya estaba cerrado');
    expect(fixture.nativeElement.textContent).toContain(
      'No se volvieron a vencer pedidos ni liberar reservas',
    );
  });

  it('deberia mostrar error si no carga el reporte', () => {
    dailyCloseService.getDailyReport.and.returnValue(
      throwError(() => new Error('API error')),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo cargar el reporte diario.',
    );
  });

  it('deberia exponer metricas, formateos y trackers del reporte', () => {
    fixture.detectChanges();
    const viewModel = page();

    const summaryLabels = viewModel.summaryMetrics().map((metric) => metric.label);

    expect(summaryLabels).toEqual(jasmine.arrayContaining([
      'Total vendido',
      'Pedidos totales',
      'Entregados',
      'Vencidos',
      'Reservas liberadas',
    ]));
    expect(summaryLabels.some((label) => label.includes('devueltos'))).toBeTrue();
    expect(viewModel.orderStatusMetrics().map((metric) => metric.value)).toEqual([
      18,
      2,
      1,
      1,
      3,
      0,
      0,
    ]);
    expect(viewModel.closureMetrics()).toEqual([]);

    viewModel.closeStatus.set({
      buffetId,
      date: report.date,
      closed: true,
      expiredPurchases: 3,
      releasedReservations: 8,
      refundedCredits: 150,
    });

    const closureLabels = viewModel.closureMetrics().map((metric) => metric.label);

    expect(closureLabels).toEqual(jasmine.arrayContaining([
      'Pedidos vencidos',
      'Reservas liberadas',
      'Total vendido',
    ]));
    expect(closureLabels.some((label) => label.includes('devueltos'))).toBeTrue();
    expect(viewModel.formatMoney(null)).toContain('0');
    expect(viewModel.formatNumber(1234)).toContain('1');
    expect(viewModel.formatOptionalNumber(undefined)).toMatch(/Sin m.nimo/);
    expect(viewModel.formatDate('2026-6-9')).toBe('09/06/2026');
    expect(viewModel.formatDate('sin-fecha')).toBe('sin-fecha');
    expect(viewModel.formatInventoryStatus('DESCONOCIDO')).toBe('DESCONOCIDO');
    expect(viewModel.formatInventoryMode('OTRO')).toBe('OTRO');
    expect(viewModel.formatMovementType('AJUSTE_MANUAL')).toBe('Ajuste manual');
    expect(viewModel.soldOutProductName({ nombre: 'TurrÃ³n' })).toBe('TurrÃ³n');
    expect(viewModel.soldOutProductName({})).toBe('Producto agotado');
    expect(viewModel.trackProductSale(0, { productId: 'product-1' })).toBe(
      'product-1',
    );
    expect(viewModel.trackInventory(0, report.inventory[0])).toBe('product-1');
    expect(
      viewModel.trackDailyClose(0, {
        id: 'close-1',
        buffetId,
        date: report.date,
        expiredPurchases: 0,
        releasedReservations: 0,
        refundedCredits: 0,
      }),
    ).toBe('close-1');
  });

  it('deberia cambiar la fecha y resetear estado paginado', () => {
    fixture.detectChanges();
    const viewModel = page();
    const callsBefore = dailyCloseService.getDailyReport.calls.count();

    viewModel.closeResult.set({
      alreadyClosed: false,
      expiredPurchases: 1,
      releasedReservations: 2,
      refundedCredits: 3,
      report,
    });
    viewModel.closeStatus.set({
      buffetId,
      date: report.date,
      closed: true,
      expiredPurchases: 1,
      releasedReservations: 2,
      refundedCredits: 3,
    });
    viewModel.inventoryPage.set(2);
    viewModel.soldProductsPage.set(2);

    viewModel.onDateChange(inputEvent('2026-06-10'));

    expect(viewModel.selectedDate()).toBe('2026-06-10');
    expect(viewModel.closeResult()).toBeNull();
    expect(viewModel.inventoryPage()).toBe(1);
    expect(viewModel.soldProductsPage()).toBe(1);
    expect(dailyCloseService.getDailyReport.calls.count()).toBe(callsBefore + 1);

    viewModel.onDateChange(inputEvent('2026-06-10'));
    expect(dailyCloseService.getDailyReport.calls.count()).toBe(callsBefore + 1);
  });

  it('deberia manejar errores operativos de estado, historial, cierre y csv', () => {
    fixture.detectChanges();
    const viewModel = page();

    dailyCloseService.getDailyCloseStatus.and.returnValue(
      throwError(() => new Error('status error')),
    );
    viewModel.loadCloseStatus();
    expect(viewModel.closeStatus()).toBeNull();
    expect(viewModel.closeStatusErrorMessage()).toContain('No se pudo verificar');

    dailyCloseService.getDailyCloses.and.returnValue(
      throwError(() => new Error('history error')),
    );
    viewModel.loadCloseHistory();
    expect(viewModel.dailyCloses()).toEqual([]);
    expect(viewModel.historyErrorMessage()).toContain('No se pudieron cargar');

    dailyCloseService.closeDaily.and.returnValue(
      throwError(() => new Error('close error')),
    );
    viewModel.confirmDailyClose();
    expect(viewModel.closingDay()).toBeFalse();
    expect(toastService.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/No se pudo cerrar/),
      'error',
    );

    dailyCloseService.downloadDailyReportCsv.and.returnValue(
      throwError(() => new Error('csv error')),
    );
    viewModel.downloadCsv();
    expect(toastService.mostrar).toHaveBeenCalledWith(
      'No se pudo descargar el CSV.',
      'error',
    );
  });

  it('deberia refrescar despues del cierre y avisar si falla ese refresco', () => {
    fixture.detectChanges();
    const viewModel = page();

    dailyCloseService.closeDaily.and.returnValue(
      of({
        alreadyClosed: false,
        expiredPurchases: 3,
        releasedReservations: 8,
        refundedCredits: 0,
        report,
      }),
    );
    dailyCloseService.refreshAfterClose.and.returnValue(
      throwError(() => new Error('refresh error')),
    );

    viewModel.confirmDailyClose();

    expect(viewModel.refreshingAfterClose()).toBeFalse();
    expect(viewModel.closeResult()).toEqual(
      jasmine.objectContaining({ expiredPurchases: 3 }),
    );
    expect(toastService.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/refrescar el reporte/),
      'error',
    );
  });

  it('deberia abrir y cerrar modales, seleccionar cierres y navegar', () => {
    fixture.detectChanges();
    const viewModel = page();

    viewModel.openConfirmModal();
    expect(viewModel.confirmModalOpen()).toBeTrue();

    viewModel.closingDay.set(true);
    viewModel.closeConfirmModal();
    expect(viewModel.confirmModalOpen()).toBeTrue();

    viewModel.closingDay.set(false);
    viewModel.closeConfirmModal();
    expect(viewModel.confirmModalOpen()).toBeFalse();

    viewModel.loadingCloseStatus.set(true);
    viewModel.openConfirmModal();
    expect(viewModel.confirmModalOpen()).toBeFalse();

    viewModel.loadingCloseStatus.set(false);
    viewModel.openHistoryModal();
    expect(viewModel.historyModalOpen()).toBeTrue();

    viewModel.onHistoryFromChange(inputEvent('2026-06-01'));
    viewModel.onHistoryToChange(inputEvent('2026-06-09'));
    expect(viewModel.historyFrom()).toBe('2026-06-01');
    expect(viewModel.historyTo()).toBe('2026-06-09');

    viewModel.closeHistoryModal();
    expect(viewModel.historyModalOpen()).toBeFalse();

    viewModel.selectDailyClose({
      id: 'close-selected',
      buffetId,
      date: '2026-06-08',
      expiredPurchases: 2,
      releasedReservations: 4,
      refundedCredits: 100,
    });

    expect(viewModel.selectedDate()).toBe('2026-06-08');
    expect(viewModel.isSelectedClose(viewModel.dailyCloses()[0])).toBeFalse();
    expect(viewModel.historyModalOpen()).toBeFalse();

    viewModel.volver();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });

  it('deberia detectar stock operativo y limitar paginaciones', () => {
    const inventory = Array.from({ length: 6 }, (_, index) => ({
      productId: `product-${index + 1}`,
      productName: `Producto ${index + 1}`,
      stockActual: index === 0 ? 0 : 10,
      stockReservado: 0,
      stockDisponible: index === 0 ? 0 : 10,
      stockMinimo: 3,
      estadoInventario:
        index === 0 ? 'SIN_STOCK' : index === 1 ? 'BAJO_STOCK' : 'DISPONIBLE',
      tipoManejoInventario: 'STOCK_EXACTO',
    }));
    const products = Array.from({ length: 6 }, (_, index) => ({
      productId: `product-${index + 1}`,
      productName: `Producto ${index + 1}`,
      quantity: index + 1,
      total: index + 1,
    }));

    dailyCloseService.getDailyReport.and.returnValue(
      of({
        ...report,
        inventory,
        products,
      }),
    );

    fixture.detectChanges();
    const viewModel = page();

    expect(viewModel.isInventorySoldOut(viewModel.sortedInventory()[0])).toBeTrue();
    expect(viewModel.isInventoryLowStock(viewModel.sortedInventory()[1])).toBeTrue();
    expect(viewModel.isSoldProductSoldOut(products[0])).toBeTrue();
    expect(viewModel.isSoldProductLowStock(products[1])).toBeTrue();
    expect(viewModel.isSoldProductSoldOut({ ...products[0], productId: 'otro' })).toBeFalse();

    viewModel.nextInventoryPage();
    viewModel.nextSoldProductsPage();
    expect(viewModel.inventoryPage()).toBe(2);
    expect(viewModel.soldProductsPage()).toBe(2);

    viewModel.nextInventoryPage();
    viewModel.nextSoldProductsPage();
    expect(viewModel.inventoryPage()).toBe(2);
    expect(viewModel.soldProductsPage()).toBe(2);

    viewModel.previousInventoryPage();
    viewModel.previousSoldProductsPage();
    viewModel.previousInventoryPage();
    viewModel.previousSoldProductsPage();
    expect(viewModel.inventoryPage()).toBe(1);
    expect(viewModel.soldProductsPage()).toBe(1);
  });

  it('deberia refrescar el reporte por eventos SSE del dia seleccionado', fakeAsync(() => {
    let onRefresh: ((event: RealtimeInventoryEvent) => void) | undefined;
    const abortController = new AbortController();
    spyOn(abortController, 'abort').and.callThrough();
    spyOnProperty(Document.prototype, 'visibilityState', 'get').and.returnValue('visible');
    inventoryRealtimeService.connect.and.callFake((_buffetId, handlers) => {
      onRefresh = handlers.onRefresh;
      return abortController;
    });

    fixture.detectChanges();
    const viewModel = page();
    viewModel.historyModalOpen.set(true);
    const reportCallsBefore = dailyCloseService.getDailyReport.calls.count();
    const historyCallsBefore = dailyCloseService.getDailyCloses.calls.count();

    onRefresh?.({
      type: 'DAILY_REPORT_CHANGED',
      date: viewModel.selectedDate(),
    } as RealtimeInventoryEvent);
    onRefresh?.({
      type: 'DAILY_REPORT_CHANGED',
      date: viewModel.selectedDate(),
    } as RealtimeInventoryEvent);

    tick(2499);
    expect(inventoryRealtimeService.recordRefetch).not.toHaveBeenCalled();

    tick(1);

    expect(inventoryRealtimeService.recordRefetch).toHaveBeenCalledWith(
      'daily-close-report',
    );
    expect(dailyCloseService.getDailyReport.calls.count()).toBe(
      reportCallsBefore + 1,
    );
    expect(dailyCloseService.getDailyCloses.calls.count()).toBe(
      historyCallsBefore + 1,
    );

    component.ngOnDestroy();

    expect(abortController.abort).toHaveBeenCalled();
  }));
  describe('Branch Coverage Tests', () => {
    it('deberia setear error si perfilService.obtenerBuffetId devuelve null en ngOnInit', () => {
      perfilService.obtenerBuffetId.and.returnValue(null);
      component.ngOnInit();
      expect(page().errorMessage()).toBe('No se encontró un buffet asociado a tu perfil.');
    });

    it('deberia ignorar onDateChange si es la misma fecha', () => {
      fixture.detectChanges();
      page().selectedDate.set('2026-06-09');
      const event = { target: { value: '2026-06-09' } } as unknown as Event;
      page().onDateChange(event);
      expect(dailyCloseService.getDailyReport.calls.count()).toBe(1); // Only the initial call, no new call
    });

    it('deberia manejar error en downloadDailyReportCsv', () => {
      fixture.detectChanges();
      dailyCloseService.downloadDailyReportCsv.and.returnValue(throwError(() => new Error('err')));
      page().downloadCsv();
      expect(toastService.mostrar).toHaveBeenCalledWith('No se pudo descargar el CSV.', 'error');
    });

    it('formatInventoryStatus fallback', () => {
      expect(page().formatInventoryStatus('CUALQUIERA')).toBe('CUALQUIERA');
    });

    it('formatInventoryMode fallback', () => {
      expect(page().formatInventoryMode('OTRO')).toBe('OTRO');
    });

    it('formatMovementType fallback', () => {
      expect(page().formatMovementType('OTRO_TIPO_MAS')).toBe('Otro tipo mas');
    });

    it('formatDate fallback', () => {
      expect(page().formatDate('')).toBe('-');
      expect(page().formatDate('invalida')).toBe('invalida');
    });

    it('formatMoney y formatOptionalNumber fallback', () => {
      expect(page().formatMoney(null)).toBeTruthy(); // It formats 0
      expect(page().formatOptionalNumber(null)).toBe('Sin mínimo');
    });

    it('deberia devolver [] en metrics si no hay report o summary', () => {
      fixture.detectChanges();
      page().report.set(null);
      expect(page().summaryMetrics()).toEqual([]);
      expect(page().orderStatusMetrics()).toEqual([]);
      page().closeStatus.set(null);
      page().closeResult.set(null);
      expect(page().closureMetrics()).toEqual([]);
    });

    it('deberia abortar early en confirmDailyClose', () => {
      fixture.detectChanges();
      page().closeStatus.set({ closed: true } as any);
      page().confirmDailyClose();
      // Only the calls from ngOnInit
      expect(dailyCloseService.closeDaily).not.toHaveBeenCalled();
    });

    it('deberia atrapar error en confirmDailyClose', () => {
      fixture.detectChanges();
      dailyCloseService.closeDaily.and.returnValue(throwError(() => new Error('err')));
      page().confirmDailyClose();
      expect(toastService.mostrar).toHaveBeenCalledWith('No se pudo cerrar el día.', 'error');
    });

    it('deberia atrapar error en refreshAfterClose', () => {
      fixture.detectChanges();
      dailyCloseService.refreshAfterClose.and.returnValue(throwError(() => new Error('err')));
      component['refreshAfterClose']('buffet-123');
      expect(toastService.mostrar).toHaveBeenCalledWith('El cierre se realizó, pero no se pudo refrescar el reporte.', 'error');
    });

    it('deberia manejar error al loadCloseHistory', () => {
      dailyCloseService.getDailyCloses.and.returnValue(throwError(() => new Error('err')));
      fixture.detectChanges(); // Will trigger loadCloseHistory
      expect(page().historyErrorMessage()).toBe('No se pudieron cargar los cierres.');
    });

    it('deberia setear selectedDate si date es falsy pero es today', () => {
      // Testing isRealtimeEventForSelectedDate fallback to today
      const spy = spyOn<any>(component, 'isSelectedDateToday').and.returnValue(true);
      const res = component['isRealtimeEventForSelectedDate']({} as any);
      expect(res).toBeTrue();
    });
  });
});
