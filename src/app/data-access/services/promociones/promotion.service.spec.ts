import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PromotionService, Promotion } from './promotion.service';
import { environment } from '../../../../environments/environment';

describe('PromotionService', () => {
  let service: PromotionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PromotionService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PromotionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('approvePromotion', () => {
    it('Dado que se llama a approvePromotion con un ID válido, debería hacer un PUT a /promotions/:id con status ACTIVE', () => {
      const mockId = 'promo-123';
      const mockResponse: Promotion = {
        id: mockId,
        name: 'Promo Test',
        discountPercentage: 10,
        productIds: [],
        startDate: '2026-06-12',
        endDate: '2026-06-20',
        status: 'ACTIVE'
      };

      service.approvePromotion(mockId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions/${mockId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'ACTIVE' });
      req.flush(mockResponse);
    });
  });

  describe('discardPromotion', () => {
    it('Dado que se llama a discardPromotion con un ID válido, debería hacer un DELETE a /promotions/:id', () => {
      const mockId = 'promo-123';

      service.discardPromotion(mockId).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions/${mockId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
