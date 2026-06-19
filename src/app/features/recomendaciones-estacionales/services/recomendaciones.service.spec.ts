import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RecomendacionesService } from './recomendaciones.service';
import { environment } from '../../../../environments/environment';
import { RespuestaRecomendaciones } from '../models/recomendacion.model';

describe('RecomendacionesService', () => {
  let service: RecomendacionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecomendacionesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RecomendacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que se piden recomendaciones, deberia llamar al endpoint con lat y lng', () => {
    const mockResponse: RespuestaRecomendaciones = {
      sugerencias: []
    };

    service.getSeasonalRecommendations(10, 20).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(request => 
      request.url === `${environment.apiUrl}/recomendations/seasonal` &&
      request.params.get('latitude') === '10' &&
      request.params.get('longitude') === '20'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
