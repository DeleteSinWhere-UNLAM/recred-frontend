import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MicrocreditosService, SchoolCredit } from './microcreditos.service';
import { environment } from '../../../environments/environment';

describe('MicrocreditosService', () => {
  let service: MicrocreditosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MicrocreditosService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(MicrocreditosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('requestCredit', () => {
    it('dado que se llama a requestCredit, debería hacer un POST a /school-credits con el body correcto', () => {
      const mockCredit: SchoolCredit = {
        id: '1', studentId: 's1', amount: 1000, installments: 3, status: 'PENDING', createdAt: '2026-01-01'
      };

      service.requestCredit('s1', 'p1', 1000, 3).subscribe(credit => {
        expect(credit).toEqual(mockCredit);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/school-credits`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ studentId: 's1', parentId: 'p1', amount: 1000, installments: 3 });
      req.flush(mockCredit);
    });
  });

  describe('getLastRecharge', () => {
    it('dado que se llama a getLastRecharge, debería hacer un GET a la ruta de last-recharge', () => {
      service.getLastRecharge('s1').subscribe(amount => {
        expect(amount).toBe(500);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/school-credits/alumno/s1/last-recharge`);
      expect(req.request.method).toBe('GET');
      req.flush(500);
    });
  });

  describe('getActiveCredit', () => {
    it('dado que se llama a getActiveCredit y existe un crédito, debería retornar el crédito activo', () => {
      const mockCredit: SchoolCredit = {
        id: '1', studentId: 's1', amount: 1000, installments: 3, status: 'ACTIVE', createdAt: '2026-01-01'
      };

      service.getActiveCredit('s1').subscribe(credit => {
        expect(credit).toEqual(mockCredit);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/school-credits/alumno/s1/active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCredit);
    });

    it('dado que se llama a getActiveCredit y no existe un crédito, debería retornar null', () => {
      service.getActiveCredit('s1').subscribe(credit => {
        expect(credit).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/school-credits/alumno/s1/active`);
      expect(req.request.method).toBe('GET');
      req.flush(null);
    });
  });
});
