import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RecomendacionesResponse } from '../models/recomendacion.model';
import {
  LAT_TEST,
  LNG_TEST,
  RecomendacionesResponseMother,
} from '../recomendaciones-estacionales.mother';
import { RecomendacionesService } from './recomendaciones.service';

describe('RecomendacionesService', () => {
  const URL_SEASONAL = `${environment.apiUrl}/recomendations/seasonal`;

  let service: RecomendacionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecomendacionesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RecomendacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getSeasonalRecommendations', () => {
    it('dado lat y lng, cuando pido recomendaciones, deberia hacer GET al endpoint con ambos como query params', async () => {
      const respuesta = RecomendacionesResponseMother.crear();

      const promesa = whenPidoRecomendacionesConLatLng(LAT_TEST, LNG_TEST);

      thenSeHizoGetSeasonalConLatLng(LAT_TEST, LNG_TEST).flush(respuesta);

      expect(await promesa).toEqual(respuesta);
    });

    it('dado que el back devuelve una respuesta vacia, cuando pido recomendaciones, deberia resolver con esa respuesta', async () => {
      const promesa = whenPidoRecomendacionesConLatLng(0, 0);

      thenSeHizoGetSeasonalConLatitude('0').flush(RecomendacionesResponseMother.crearVacio());

      const resultado = await promesa;
      expect(resultado.sugerencias).toEqual([]);
    });
  });

  function whenPidoRecomendacionesConLatLng(lat: number, lng: number): Promise<RecomendacionesResponse> {
    return firstValueFrom(service.getSeasonalRecommendations(lat, lng));
  }

  function thenSeHizoGetSeasonalConLatLng(lat: number, lng: number): TestRequest {
    const req = httpMock.expectOne(
      (r) =>
        r.url === URL_SEASONAL &&
        r.params.get('latitude') === lat.toString() &&
        r.params.get('longitude') === lng.toString(),
    );
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoGetSeasonalConLatitude(latitude: string): TestRequest {
    return httpMock.expectOne((r) => r.url === URL_SEASONAL && r.params.get('latitude') === latitude);
  }
});
