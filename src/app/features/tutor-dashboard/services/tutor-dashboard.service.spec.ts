import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TutorDashboardService } from './tutor-dashboard.service';
import { environment } from '../../../../environments/environment';
import { TutorGlobalDashboardSummary } from '../models/tutor-dashboard.model';

describe('TutorDashboardService', () => {
  let service: TutorDashboardService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TutorDashboardService]
    });
    service = TestBed.inject(TutorDashboardService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getGlobalDashboard', () => {
    it('dado que se piden datos, debe llamar a GET para el dashboard global', () => {
      const mockResponse: TutorGlobalDashboardSummary = {} as any;

      service.getGlobalDashboard().subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/tutores/me/dashboard-global`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('transferBalance', () => {
    it('dado que se transfiere, debe llamar a POST para transferir saldo', () => {
      service.transferBalance('student1', 'student2', 500).subscribe();

      const req = httpTestingController.expectOne(`${environment.apiUrl}/wallets/transfer`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        fromStudentId: 'student1',
        toStudentId: 'student2',
        amount: 500
      });
      req.flush(null);
    });
  });
});
