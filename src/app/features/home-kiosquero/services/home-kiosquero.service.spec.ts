import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PanelKiosquero } from '../models/panel-kiosquero.model';
import { HomeKiosqueroService } from './home-kiosquero.service';

describe('HomeKiosqueroService', () => {
  let service: HomeKiosqueroService;
  let httpMock: HttpTestingController;

  const buffetId = 'buffet-123';
  const date = '2026-06-11';
  const kiosquerosUrl = `${environment.apiUrl}/kiosqueros`;
  const panel: PanelKiosquero = {
    buffetId,
    date,
    summary: {
      totalSold: 12500,
      totalOrders: 18,
      deliveredOrders: 14,
      averageTicket: 892.86,
      pendingOrders: 3,
      soldOutProducts: 2,
    },
    activity: {
      salesByTimeSlot: [],
      salesByCategory: [],
      ordersByStatus: [],
      ordersByPurchaseType: [],
    },
    products: {
      topSoldProducts: [],
      mostReservedProducts: [],
      productsNeedingRestock: [],
      soldOutProducts: [],
    },
    alerts: {
      expiredOrders: 1,
      releasedReservations: 3,
      refundedCredits: 1500,
      soldOutEvents: 1,
      pendingOrders: 3,
      readyOrders: 2,
      items: [],
    },
    trends: {
      lastSevenDays: [],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HomeKiosqueroService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(HomeKiosqueroService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deberia obtener el panel por fecha', () => {
    service.getPanel(buffetId, date).subscribe((result) => {
      expect(result).toEqual(panel);
    });

    const req = httpMock.expectOne(
      `${kiosquerosUrl}/${buffetId}/dashboard?date=${date}`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(panel);
  });

  it('deberia permitir consultar sin fecha', () => {
    service.getPanel(buffetId).subscribe((result) => {
      expect(result).toEqual(panel);
    });

    const req = httpMock.expectOne(`${kiosquerosUrl}/${buffetId}/dashboard`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('date')).toBeFalse();
    req.flush(panel);
  });

  it('deberia obtener el dashboard por rango de fechas', () => {
    service
      .getPanelByRange(buffetId, {
        from: '2026-06-08',
        to: '2026-06-14',
      })
      .subscribe((result) => {
        expect(result).toEqual(panel);
      });

    const req = httpMock.expectOne(
      `${kiosquerosUrl}/${buffetId}/dashboard?from=2026-06-08&to=2026-06-14`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(panel);
  });
});
