import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  LAT_TEST,
  LNG_TEST,
  RecomendacionesResponseMother,
} from '../recomendaciones-estacionales.mother';
import { RecomendacionesService } from './recomendaciones.service';

describe('RecomendacionesService', () => {
  const URL = `${environment.apiUrl}/recomendations/seasonal`;

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

      const promesa = firstValueFrom(service.getSeasonalRecommendations(LAT_TEST, LNG_TEST));
      const req = httpMock.expectOne(
        (r) =>
          r.url === URL &&
          r.params.get('latitude') === LAT_TEST.toString() &&
          r.params.get('longitude') === LNG_TEST.toString(),
      );
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);

      expect(await promesa).toEqual(respuesta);
    });

    it('dado que el back devuelve una respuesta vacia, cuando pido, deberia resolver con esa respuesta', async () => {
      const promesa = firstValueFrom(service.getSeasonalRecommendations(0, 0));
      const req = httpMock.expectOne(
        (r) => r.url === URL && r.params.get('latitude') === '0',
      );
      req.flush(RecomendacionesResponseMother.crearVacio());

      const resultado = await promesa;
      expect(resultado.sugerencias).toEqual([]);
    });
  });
});
