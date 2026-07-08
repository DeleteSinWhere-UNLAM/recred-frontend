import { TestBed } from '@angular/core/testing';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PromotionService, Promotion } from './promotion.service';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../perfil.service';

describe('PromotionService', () => {
  const URL_PROMOTIONS = `${environment.apiUrl}/promotions`;
  const URL_PROMOTION_BY_ID = (id: string): string => `${URL_PROMOTIONS}/${id}`;
  const URL_PROMOTIONS_POR_BUFFET = (buffetId: string): string => `${URL_PROMOTIONS}/buffet/${buffetId}`;

  let service: PromotionService;
  let httpMock: HttpTestingController;
  let mockPerfilService: jasmine.SpyObj<PerfilService>;

  class PromotionMother {
    static crear(override: Partial<Promotion> = {}): Promotion {
      return {
        id: 'promo-123',
        name: 'Promo Test',
        discountPercentage: 10,
        productIds: [],
        startDate: '2026-06-12',
        endDate: '2026-06-20',
        status: 'ACTIVE',
        ...override,
      } as Promotion;
    }

    static crearParcial(override: Partial<Promotion> = {}): Partial<Promotion> {
      return {
        name: 'Promo Test',
        discountPercentage: 10,
        productIds: ['prod-1'],
        startDate: '2026-06-12',
        endDate: '2026-06-20',
        ...override,
      };
    }
  }

  beforeEach(() => {
    mockPerfilService = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    TestBed.configureTestingModule({
      providers: [
        PromotionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: mockPerfilService },
      ],
    });
    service = TestBed.inject(PromotionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('approvePromotion', () => {
    it('dado un id valido y un buffetId, cuando apruebo, deberia hacer PUT /promotions/:id mandando status ACTIVE y ese buffetId', () => {
      const promo = PromotionMother.crear({ buffetId: 'buffet-123' });

      whenApruebo(promo.id, 'buffet-123');

      thenSeHizoPutPromotionCon(promo.id, 'ACTIVE', 'buffet-123').flush(promo);
    });
  });

  describe('discardPromotion', () => {
    it('dado un id valido, cuando descarto, deberia hacer DELETE /promotions/:id', () => {
      whenDescarto('promo-123');

      thenSeHizoDeletePromotion('promo-123').flush(null);
    });
  });

  describe('createPromotion', () => {
    it('dado una promocion sin buffetId, cuando la creo, deberia hacer POST /promotions con el buffetId del perfil', () => {
      givenBuffetIdEnPerfil('buffet-123');
      const promo = PromotionMother.crearParcial();
      const response = PromotionMother.crear({ ...promo, buffetId: 'buffet-123' });

      whenCreo(promo);

      thenSeHizoPostPromotionCon({ ...promo, buffetId: 'buffet-123' }).flush(response);
    });

    it('dado una promocion con buffetId explicito, cuando la creo, deberia usarlo y no tocar el perfil', () => {
      const promo: Partial<Promotion> = { name: 'Con buffet', buffetId: 'buffet-explicit' };

      whenCreo(promo);

      thenSeHizoPostPromotionCon({ ...promo, buffetId: 'buffet-explicit' }).flush({});
      expect(mockPerfilService.obtenerBuffetId).not.toHaveBeenCalled();
    });

    it('dado que no hay buffetId en la promo ni en el perfil, cuando la creo, deberia mandar string vacio', () => {
      givenBuffetIdEnPerfil(null);
      const promo: Partial<Promotion> = { name: 'Sin buffet' };

      whenCreo(promo);

      thenElBuffetIdDelPostEs('').flush({});
    });
  });

  describe('getPromotions', () => {
    it('dado un buffetId explicito, cuando pido las promociones, deberia hacer GET /promotions/buffet/:id sin consultar el perfil', () => {
      whenPidoPromocionesConBuffet('buffet-42');

      thenSeHizoGetPromotionsDelBuffet('buffet-42').flush([]);
      expect(mockPerfilService.obtenerBuffetId).not.toHaveBeenCalled();
    });

    it('dado ningun argumento, cuando pido las promociones, deberia usar el buffetId del perfil', () => {
      givenBuffetIdEnPerfil('buffet-perfil');

      whenPidoPromocionesSinBuffet();

      thenSeHizoGetPromotionsDelBuffet('buffet-perfil').flush([]);
    });
  });

  describe('getPromotionById', () => {
    it('dado un id, cuando pido la promocion, deberia hacer GET /promotions/:id', () => {
      const promo = PromotionMother.crear({ id: 'p-1', discountPercentage: 5, startDate: '2026-06-01', endDate: '2026-06-30' });

      whenPidoPromocionPorId('p-1');

      thenSeHizoGetPromotionPorId('p-1').flush(promo);
    });
  });

  function givenBuffetIdEnPerfil(buffetId: string | null): void {
    mockPerfilService.obtenerBuffetId.and.returnValue(buffetId);
  }

  function whenApruebo(id: string, buffetId: string): void {
    service.approvePromotion(id, buffetId).subscribe();
  }

  function whenDescarto(id: string): void {
    service.discardPromotion(id).subscribe();
  }

  function whenCreo(promo: Partial<Promotion>): void {
    service.createPromotion(promo).subscribe();
  }

  function whenPidoPromocionesConBuffet(buffetId: string): void {
    service.getPromotions(buffetId).subscribe();
  }

  function whenPidoPromocionesSinBuffet(): void {
    service.getPromotions().subscribe();
  }

  function whenPidoPromocionPorId(id: string): void {
    service.getPromotionById(id).subscribe();
  }

  function thenSeHizoPutPromotionCon(id: string, status: string, buffetId: string): TestRequest {
    const req = httpMock.expectOne(URL_PROMOTION_BY_ID(id));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.status).toBe(status);
    expect(req.request.body.buffetId).toBe(buffetId);
    return req;
  }

  function thenSeHizoDeletePromotion(id: string): TestRequest {
    const req = httpMock.expectOne(URL_PROMOTION_BY_ID(id));
    expect(req.request.method).toBe('DELETE');
    return req;
  }

  function thenSeHizoPostPromotionCon(expectedBody: Partial<Promotion>): TestRequest {
    const req = httpMock.expectOne(URL_PROMOTIONS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(expectedBody);
    return req;
  }

  function thenElBuffetIdDelPostEs(buffetId: string): TestRequest {
    const req = httpMock.expectOne(URL_PROMOTIONS);
    expect((req.request.body as { buffetId: string }).buffetId).toBe(buffetId);
    return req;
  }

  function thenSeHizoGetPromotionsDelBuffet(buffetId: string): TestRequest {
    const req = httpMock.expectOne(URL_PROMOTIONS_POR_BUFFET(buffetId));
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoGetPromotionPorId(id: string): TestRequest {
    const req = httpMock.expectOne(URL_PROMOTION_BY_ID(id));
    expect(req.request.method).toBe('GET');
    return req;
  }
});
