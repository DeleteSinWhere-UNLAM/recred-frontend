import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TutorGlobalDashboardSummaryMother } from '../tutor-dashboard.mother';
import { TutorDashboardService } from './tutor-dashboard.service';

describe('TutorDashboardService', () => {
  const URL_DASHBOARD = `${environment.apiUrl}/tutores/me/dashboard-global`;
  const URL_CONFIG = `${environment.apiUrl}/tutores/me/dashboard-config`;
  const URL_TRANSFER = `${environment.apiUrl}/wallets/transfer`;

  let service: TutorDashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TutorDashboardService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TutorDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getGlobalDashboard', () => {
    it('cuando pido el dashboard global, deberia hacer GET a /tutores/me/dashboard-global', async () => {
      const dashboard = TutorGlobalDashboardSummaryMother.crear();

      const promesa = whenPidoElDashboard();
      const req = httpMock.expectOne(URL_DASHBOARD);
      expect(req.request.method).toBe('GET');
      req.flush(dashboard);

      expect(await promesa).toEqual(dashboard);
    });

    it('dado que el back devuelve error, cuando pido el dashboard, deberia rechazar la promesa', async () => {
      const promesa = whenPidoElDashboard();
      httpMock.expectOne(URL_DASHBOARD).flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  describe('saveDashboardConfig', () => {
    it('dado un string de config, cuando guardo, deberia hacer PUT con content-type text/plain', async () => {
      const config = '[{"id":"finance"}]';

      const promesa = firstValueFrom(service.saveDashboardConfig(config));
      const req = httpMock.expectOne(URL_CONFIG);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBe(config);
      expect(req.request.headers.get('Content-Type')).toBe('text/plain');
      req.flush(null);

      await promesa;
    });
  });

  describe('transferBalance', () => {
    it('dado un alumno origen, un alumno destino y un monto, cuando transfiero, deberia hacer POST /wallets/transfer con esos tres valores', async () => {
      const promesa = whenTransfiero('student-1', 'student-2', 500);

      thenSeLlamaPOSTTransferConEsosTresValores('student-1', 'student-2', 500).flush(null);

      await promesa;
    });
  });

  function whenPidoElDashboard(): Promise<unknown> {
    return firstValueFrom(service.getGlobalDashboard());
  }

  function whenTransfiero(fromStudentId: string, toStudentId: string, amount: number): Promise<void> {
    return firstValueFrom(service.transferBalance(fromStudentId, toStudentId, amount));
  }

  function thenSeLlamaPOSTTransferConEsosTresValores(
    fromStudentId: string,
    toStudentId: string,
    amount: number,
  ): TestRequest {
    const req = httpMock.expectOne(URL_TRANSFER);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.fromStudentId).toBe(fromStudentId);
    expect(req.request.body.toStudentId).toBe(toStudentId);
    expect(req.request.body.amount).toBe(amount);
    return req;
  }
});
