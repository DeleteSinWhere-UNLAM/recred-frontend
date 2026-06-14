import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import { DailyReport } from './models/daily-close.model';
import { DailyClosePage } from './daily-close.page';
import { DailyCloseService } from './services/daily-close.service';
import { InventoryRealtimeService } from '../updated-inventory/services/inventory-realtime.service';

describe('DailyClosePage', () => {
  let component: DailyClosePage;
  let fixture: ComponentFixture<DailyClosePage>;
  let dailyCloseService: jasmine.SpyObj<DailyCloseService>;
  let inventoryRealtimeService: jasmine.SpyObj<InventoryRealtimeService>;
  let perfilService: jasmine.SpyObj<PerfilService>;
  let toastService: jasmine.SpyObj<ToastService>;

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
  });

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
});
