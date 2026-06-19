import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HomeKiosqueroService } from './home-kiosquero.service';
import { environment } from '../../../../environments/environment';

describe('HomeKiosqueroService', () => {
  let service: HomeKiosqueroService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HomeKiosqueroService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(HomeKiosqueroService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call getPanel without date', () => {
    service.getPanel('123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/123/dashboard`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('date')).toBeFalse();
    req.flush({});
  });

  it('should call getPanel with date', () => {
    service.getPanel('123', '2023-01-01').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/123/dashboard?date=2023-01-01`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('date')).toBe('2023-01-01');
    req.flush({});
  });

  it('should call getPanelByRange', () => {
    service.getPanelByRange('123', { from: '2023-01-01', to: '2023-01-31' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/123/dashboard?from=2023-01-01&to=2023-01-31`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('from')).toBe('2023-01-01');
    expect(req.request.params.get('to')).toBe('2023-01-31');
    req.flush({});
  });

  it('should return default resumen', () => {
    expect(service.getResumen()).toEqual({
      gananciasHoy: 12450,
      ventasHoy: 34,
      productosSinStock: 5,
      pedidosPendientes: 8,
    });
  });

  it('should return default nombre kiosquero', () => {
    expect(service.getNombreKiosquero()).toBe('Carlos');
  });
});
