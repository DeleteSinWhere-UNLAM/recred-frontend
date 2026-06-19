import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DailyCloseService } from './daily-close.service';
import { environment } from '../../../../environments/environment';
import { DailyReport, DailyCloseStatus, DailyCloseResult, DailyCloseRecord } from '../models/daily-close.model';

describe('DailyCloseService', () => {
  let service: DailyCloseService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DailyCloseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DailyCloseService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('closeDaily', () => {
    it('should call POST with date param if provided', () => {
      const mockResult: DailyCloseResult = {} as any;
      service.closeDaily('buffet-1', '2023-10-10').subscribe(res => {
        expect(res).toEqual(mockResult);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-close?date=2023-10-10`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(mockResult);
    });
  });

  describe('getDailyReport', () => {
    it('should call GET with date param', () => {
      const mockReport: DailyReport = {} as any;
      service.getDailyReport('buffet-1', '2023-10-10').subscribe(res => {
        expect(res).toEqual(mockReport);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/reports/daily?date=2023-10-10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReport);
    });
  });

  describe('getDailyCloseStatus', () => {
    it('should call GET without date param if not provided', () => {
      const mockStatus: DailyCloseStatus = {} as any;
      service.getDailyCloseStatus('buffet-1').subscribe(res => {
        expect(res).toEqual(mockStatus);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-close/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatus);
    });

    it('should call GET with date param if provided', () => {
      const mockStatus: DailyCloseStatus = {} as any;
      service.getDailyCloseStatus('buffet-1', '2023-10-10').subscribe(res => {
        expect(res).toEqual(mockStatus);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-close/status?date=2023-10-10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatus);
    });
  });

  describe('getDailyCloses', () => {
    it('should call GET with from and to params if provided', () => {
      const mockRecords: DailyCloseRecord[] = [];
      service.getDailyCloses('buffet-1', { from: '2023-01-01', to: '2023-12-31' }).subscribe(res => {
        expect(res).toEqual(mockRecords);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-closes?from=2023-01-01&to=2023-12-31`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRecords);
    });

    it('should call GET without params if not provided', () => {
      const mockRecords: DailyCloseRecord[] = [];
      service.getDailyCloses('buffet-1').subscribe(res => {
        expect(res).toEqual(mockRecords);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-closes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRecords);
    });
  });

  describe('getDailyReportCsvUrl', () => {
    it('should return correct URL', () => {
      const url = service.getDailyReportCsvUrl('buffet-1', '2023-10-10');
      expect(url).toBe(`${environment.apiUrl}/kiosqueros/buffet-1/reports/daily.csv?date=2023-10-10`);
    });
  });

  describe('downloadDailyReportCsv', () => {
    it('should call GET expecting a blob response', () => {
      const mockBlob = new Blob(['test']);
      service.downloadDailyReportCsv('buffet-1', '2023-10-10').subscribe(res => {
        expect(res).toEqual(mockBlob);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/reports/daily.csv?date=2023-10-10`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('refreshAfterClose', () => {
    it('should perform requests using forkJoin and return report', () => {
      const mockReport: DailyReport = { buffetId: 'buffet-1' } as any;
      service.refreshAfterClose('buffet-1', '2023-10-10').subscribe(res => {
        expect(res).toEqual(mockReport);
      });

      const reqInventory = httpTestingController.expectOne(`${environment.apiUrl}/inventory/buffet-1/overview`);
      expect(reqInventory.request.method).toBe('GET');
      reqInventory.flush({});

      const reqOrders = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/orders`);
      expect(reqOrders.request.method).toBe('GET');
      reqOrders.flush({});

      const reqAlerts = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/alerts`);
      expect(reqAlerts.request.method).toBe('GET');
      reqAlerts.flush({});

      const reqReport = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/reports/daily?date=2023-10-10`);
      expect(reqReport.request.method).toBe('GET');
      reqReport.flush(mockReport);
    });

    it('should handle errors gracefully using catchError and resolve to null for secondary reqs', () => {
      const mockReport: DailyReport = { buffetId: 'buffet-1' } as any;
      service.refreshAfterClose('buffet-1', '2023-10-10').subscribe(res => {
        expect(res).toEqual(mockReport);
      });

      const reqInventory = httpTestingController.expectOne(`${environment.apiUrl}/inventory/buffet-1/overview`);
      reqInventory.error(new ProgressEvent('error'));

      const reqOrders = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/orders`);
      reqOrders.error(new ProgressEvent('error'));

      const reqAlerts = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/alerts`);
      reqAlerts.error(new ProgressEvent('error'));

      const reqReport = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/reports/daily?date=2023-10-10`);
      reqReport.flush(mockReport);
    });
  });
});
