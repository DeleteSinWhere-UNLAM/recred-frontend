import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PreferenciaDetectada } from '../models/preferencia-detectada.model';
import { PreferenciasDetectadasMother } from '../preferencias-detectadas.mother';
import { PreferenciasDetectadasService } from './preferencias-detectadas.service';

describe('PreferenciasDetectadasService', () => {
  const USUARIO_ID = 'user-123';
  const URL_PREFERENCIAS = (usuarioId: string): string =>
    `${environment.apiUrl}/usuarios/${usuarioId}/preferencias?tipo=PREFERENCIA_DETECTADA`;

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

      const promesa = whenPidoPreferenciasDe(USUARIO_ID);

      thenSeHizoGetPreferenciasDe(USUARIO_ID).flush(preferencias);

      expect(await promesa).toEqual(preferencias);
    });

    it('dado que el back devuelve una lista vacia, cuando pido las preferencias, deberia resolver con lista vacia', async () => {
      const promesa = whenPidoPreferenciasDe(USUARIO_ID);

      thenSeHizoGetPreferenciasDe(USUARIO_ID).flush([]);

      expect(await promesa).toEqual([]);
    });
  });

  function whenPidoPreferenciasDe(usuarioId: string): Promise<PreferenciaDetectada[]> {
    return firstValueFrom(service.getPreferencias(usuarioId));
  }

  function thenSeHizoGetPreferenciasDe(usuarioId: string): TestRequest {
    const req = httpMock.expectOne(URL_PREFERENCIAS(usuarioId));
    expect(req.request.method).toBe('GET');
    return req;
  }
});
