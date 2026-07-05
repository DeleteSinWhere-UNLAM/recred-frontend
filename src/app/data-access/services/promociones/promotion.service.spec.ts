import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PromotionService, Promotion } from './promotion.service';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../perfil.service';

describe('PromotionService', () => {
  let service: PromotionService;
  let httpMock: HttpTestingController;
  let mockPerfilService: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    mockPerfilService = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    TestBed.configureTestingModule({
      providers: [
        PromotionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: mockPerfilService }
      ]
    });
    service = TestBed.inject(PromotionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('approvePromotion', () => {
    it('Dado que se llama a approvePromotion con un ID válido, debería hacer un PUT a /promotions/:id con status ACTIVE y buffetId', () => {
      const mockId = 'promo-123';
      const mockBuffetId = 'buffet-123';
      const mockResponse: Promotion = {
        id: mockId,
        name: 'Promo Test',
        discountPercentage: 10,
        productIds: [],
        startDate: '2026-06-12',
        endDate: '2026-06-20',
        status: 'ACTIVE',
        buffetId: mockBuffetId
      };

      service.approvePromotion(mockId, mockBuffetId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions/${mockId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'ACTIVE', buffetId: mockBuffetId });
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

  describe('createPromotion', () => {
    it('Dado que se llama a createPromotion con una promoción, debería hacer un POST a /promotions con buffetId', () => {
      mockPerfilService.obtenerBuffetId.and.returnValue('buffet-123');
      const mockPromo: Partial<Promotion> = {
        name: 'Promo Test',
        discountPercentage: 10,
        productIds: ['prod-1'],
        startDate: '2026-06-12',
        endDate: '2026-06-20'
      };

      const mockResponse: Promotion = {
        ...mockPromo,
        id: 'promo-123',
        status: 'ACTIVE',
        buffetId: 'buffet-123'
      } as Promotion;

      service.createPromotion(mockPromo).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ ...mockPromo, buffetId: 'buffet-123' });
      req.flush(mockResponse);
    });

    it('Dado que la promocion trae buffetId explicito, deberia usarlo en el payload y no tocar el perfil', () => {
      const promo: Partial<Promotion> = { name: 'Con buffet', buffetId: 'buffet-explicit' };

      service.createPromotion(promo).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions`);
      expect(req.request.body).toEqual({ ...promo, buffetId: 'buffet-explicit' });
      expect(mockPerfilService.obtenerBuffetId).not.toHaveBeenCalled();
      req.flush({});
    });

    it('Dado que no hay buffetId en la promo ni en el perfil, deberia mandar string vacio', () => {
      mockPerfilService.obtenerBuffetId.and.returnValue(null);
      const promo: Partial<Promotion> = { name: 'Sin buffet' };

      service.createPromotion(promo).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions`);
      expect((req.request.body as { buffetId: string }).buffetId).toBe('');
      req.flush({});
    });
  });

  describe('getPromotions', () => {
    it('Dado un buffetId explicito, deberia hacer GET a /promotions/buffet/:id sin consultar el perfil', () => {
      service.getPromotions('buffet-42').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions/buffet/buffet-42`);
      expect(req.request.method).toBe('GET');
      expect(mockPerfilService.obtenerBuffetId).not.toHaveBeenCalled();
      req.flush([]);
    });

    it('Dado ningun argumento, deberia usar el buffetId del perfil', () => {
      mockPerfilService.obtenerBuffetId.and.returnValue('buffet-perfil');

      service.getPromotions().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions/buffet/buffet-perfil`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getPromotionById', () => {
    it('Dado un id, deberia hacer GET a /promotions/:id', () => {
      const mockPromo: Promotion = {
        id: 'p-1',
        name: 'Test',
        discountPercentage: 5,
        productIds: [],
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        status: 'ACTIVE',
      };

      service.getPromotionById('p-1').subscribe((res) => {
        expect(res).toEqual(mockPromo);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/promotions/p-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPromo);
    });
  });
});
