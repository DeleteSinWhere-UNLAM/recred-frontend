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

describe('DailyClosePage', () => {
  let component: DailyClosePage;
  let fixture: ComponentFixture<DailyClosePage>;
  let dailyCloseService: jasmine.SpyObj<DailyCloseService>;
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
        'closeDaily',
        'refreshAfterClose',
        'getDailyReportCsvUrl',
        'downloadDailyReportCsv',
      ],
    );
    perfilService = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'obtenerBuffetId',
    ]);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    dailyCloseService.getDailyReport.and.returnValue(of(report));
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

    expect(dailyCloseService.getDailyReport).toHaveBeenCalledWith(
      buffetId,
      jasmine.any(String),
    );
    expect(fixture.nativeElement.textContent).toContain('Cierre diario');
    expect(fixture.nativeElement.textContent).toContain('Alfajor');
    expect(fixture.nativeElement.textContent).toContain('09/06/2026');
    expect(fixture.nativeElement.textContent).not.toContain('2026-06-09');
    expect(fixture.nativeElement.textContent).toContain('Minimo 3');
    expect(fixture.nativeElement.textContent).toContain('Sin minimo');
  });

  it('deberia marcar productos agotados y bajo stock con clases operativas', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.daily-close__product-row--low-stock')).toBeTruthy();
    expect(compiled.querySelector('.daily-close__product-row--sold-out')).toBeTruthy();
    expect(compiled.querySelector('.daily-close__inventory-badge--low-stock')).toBeTruthy();
    expect(compiled.querySelector('.daily-close__inventory-badge--sold-out')).toBeTruthy();
  });

  it('deberia cerrar el dia y refrescar datos operativos', () => {
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

  it('deberia mostrar mensaje si el dia ya estaba cerrado', () => {
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

    expect(fixture.nativeElement.textContent).toContain('El dia ya estaba cerrado');
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
