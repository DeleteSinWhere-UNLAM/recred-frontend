import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ReporteDiario } from '../models/cierre-diario.model';
import { CierreDiarioService } from './cierre-diario.service';

describe('CierreDiarioService', () => {
  let service: CierreDiarioService;
  let httpMock: HttpTestingController;

  const buffetId = 'buffet-123';
  const date = '2026-06-09';
  const kiosquerosUrl = `${environment.apiUrl}/kiosqueros`;

  const report: ReporteDiario = {
    buffetId,
    date,
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
    products: [],
    inventory: [],
    soldOutProducts: [],
    salesByPaymentMethod: [],
    stockMovements: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CierreDiarioService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CierreDiarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deberia cerrar el dia sin body y con fecha', () => {
    const response = {
      alreadyClosed: false,
      expiredPurchases: 3,
      releasedReservations: 8,
      refundedCredits: 0,
      report,
    };

    service.closeDaily(buffetId, date).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      `${kiosquerosUrl}/${buffetId}/daily-close?date=${date}`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush(response);
  });

  it('deberia obtener el reporte diario JSON', () => {
    service.getReporteDiario(buffetId, date).subscribe((result) => {
      expect(result).toEqual(report);
    });

    const req = httpMock.expectOne(
      `${kiosquerosUrl}/${buffetId}/reports/daily?date=${date}`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(report);
  });

  it('deberia obtener el estado del cierre diario por fecha', () => {
    const response = {
      buffetId,
      date,
      closed: true,
      expiredPurchases: 2,
      releasedReservations: 4,
      refundedCredits: 0,
    };

    service.getDailyCloseStatus(buffetId, date).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      `${kiosquerosUrl}/${buffetId}/daily-close/status?date=${date}`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('deberia listar cierres diarios con filtros opcionales', () => {
    const response = [
      {
        id: 'close-1',
        buffetId,
        date,
        expiredPurchases: 2,
        releasedReservations: 4,
        refundedCredits: 0,
      },
    ];

    service
      .getDailyCloses(buffetId, { from: '2026-06-01', to: '2026-06-30' })
      .subscribe((result) => {
        expect(result).toEqual(response);
      });

    const req = httpMock.expectOne(
      `${kiosquerosUrl}/${buffetId}/daily-closes?from=2026-06-01&to=2026-06-30`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('deberia refrescar endpoints operativos despues del cierre y devolver reporte', () => {
    service.refreshAfterClose(buffetId, date).subscribe((result) => {
      expect(result).toEqual(report);
    });

    httpMock
      .expectOne(`${environment.apiUrl}/inventory/${buffetId}/overview`)
      .flush([]);
    httpMock.expectOne(`${kiosquerosUrl}/${buffetId}/orders`).flush([]);
    httpMock.expectOne(`${kiosquerosUrl}/${buffetId}/alerts`).flush([]);
    httpMock
      .expectOne(`${kiosquerosUrl}/${buffetId}/reports/daily?date=${date}`)
      .flush(report);
  });

  it('deberia armar la URL directa del CSV', () => {
    expect(service.getReporteDiarioCsvUrl(buffetId, date)).toBe(
      `${kiosquerosUrl}/${buffetId}/reports/daily.csv?date=${date}`,
    );
  });

  it('deberia descargar el CSV como blob por HttpClient', () => {
    const csv = new Blob(['metric,value'], { type: 'text/csv' });

    service.downloadReporteDiarioCsv(buffetId, date).subscribe((result) => {
      expect(result).toBe(csv);
    });

    const req = httpMock.expectOne(
      `${kiosquerosUrl}/${buffetId}/reports/daily.csv?date=${date}`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(csv);
  });
});
