import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CierreDiarioService } from './cierre-diario.service';
import { environment } from '../../../../environments/environment';
import {
  ReporteDiario,
  EstadoCierreDiario,
  ResultadoCierreDiario,
  RegistroCierreDiario,
} from '../models/cierre-diario.model';

describe('CierreDiarioService', () => {
  let service: CierreDiarioService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CierreDiarioService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CierreDiarioService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  describe('closeDaily', () => {
    it('debería hacer POST con date en query si se provee', () => {
      const mockResult: ResultadoCierreDiario = {} as any;
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
    it('debería hacer GET con date en query', () => {
      const mockReport: ReporteDiario = {} as any;
      service.getDailyReport('buffet-1', '2023-10-10').subscribe(res => {
        expect(res).toEqual(mockReport);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/reports/daily?date=2023-10-10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReport);
    });
  });

  describe('getDailyCloseStatus', () => {
    it('debería hacer GET sin date si no se provee', () => {
      const mockStatus: EstadoCierreDiario = {} as any;
      service.getDailyCloseStatus('buffet-1').subscribe(res => {
        expect(res).toEqual(mockStatus);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-close/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatus);
    });

    it('debería hacer GET con date si se provee', () => {
      const mockStatus: EstadoCierreDiario = {} as any;
      service.getDailyCloseStatus('buffet-1', '2023-10-10').subscribe(res => {
        expect(res).toEqual(mockStatus);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-close/status?date=2023-10-10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatus);
    });
  });

  describe('getDailyCloses', () => {
    it('debería hacer GET con from y to si se proveen', () => {
      const mockRecords: RegistroCierreDiario[] = [];
      service.getDailyCloses('buffet-1', { from: '2023-01-01', to: '2023-12-31' }).subscribe(res => {
        expect(res).toEqual(mockRecords);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-closes?from=2023-01-01&to=2023-12-31`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRecords);
    });

    it('debería hacer GET sin params si no se proveen', () => {
      const mockRecords: RegistroCierreDiario[] = [];
      service.getDailyCloses('buffet-1').subscribe(res => {
        expect(res).toEqual(mockRecords);
      });
      const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/buffet-1/daily-closes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRecords);
    });
  });

  describe('getDailyReportCsvUrl', () => {
    it('debería devolver la URL correcta', () => {
      const url = service.getDailyReportCsvUrl('buffet-1', '2023-10-10');
      expect(url).toBe(`${environment.apiUrl}/kiosqueros/buffet-1/reports/daily.csv?date=2023-10-10`);
    });
  });

  describe('downloadDailyReportCsv', () => {
    it('debería hacer GET esperando un blob', () => {
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
    it('debería hacer requests con forkJoin y devolver el reporte', () => {
      const mockReport: ReporteDiario = { buffetId: 'buffet-1' } as any;
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

    it('debería manejar errores con catchError y resolver a null las secundarias', () => {
      const mockReport: ReporteDiario = { buffetId: 'buffet-1' } as any;
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
