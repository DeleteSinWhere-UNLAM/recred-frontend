import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PreferenciasDetectadasMother } from '../preferencias-detectadas.mother';
import { PreferenciasDetectadasService } from './preferencias-detectadas.service';

describe('PreferenciasDetectadasService', () => {
  const USUARIO_ID = 'user-123';

  let service: PreferenciasDetectadasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PreferenciasDetectadasService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PreferenciasDetectadasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getPreferencias', () => {
    it('dado un usuarioId, cuando pido las preferencias, deberia hacer GET al endpoint con tipo=PREFERENCIA_DETECTADA', async () => {
      const preferencias = [PreferenciasDetectadasMother.crearPreferencia()];

      const promesa = firstValueFrom(service.getPreferencias(USUARIO_ID));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/usuarios/${USUARIO_ID}/preferencias?tipo=PREFERENCIA_DETECTADA`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(preferencias);

      expect(await promesa).toEqual(preferencias);
    });

    it('dado que el back devuelve una lista vacia, cuando pido las preferencias, deberia resolver con lista vacia', async () => {
      const promesa = firstValueFrom(service.getPreferencias(USUARIO_ID));
      httpMock
        .expectOne(
          `${environment.apiUrl}/usuarios/${USUARIO_ID}/preferencias?tipo=PREFERENCIA_DETECTADA`,
        )
        .flush([]);

      expect(await promesa).toEqual([]);
    });
  });
});
