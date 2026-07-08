import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ResumenSemanal } from '../models/resumen-semanal.model';
import { ResumenSemanalMother } from '../resumen-semanal.mother';
import { ResumenSemanalService } from './resumen-semanal.service';

describe('ResumenSemanalService', () => {
  const URL_RESUMEN = `${environment.apiUrl}/resumen/me`;

  let service: ResumenSemanalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ResumenSemanalService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ResumenSemanalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getResumen', () => {
    it('cuando pido el resumen, deberia hacer GET a /resumen/me y devolver el body', async () => {
      const resumen = ResumenSemanalMother.crear();

      const promesa = whenPidoElResumen();

      thenSeHizoGetResumen().flush(resumen);

      expect(await promesa).toEqual(resumen);
    });

    it('dado que el back devuelve error, cuando pido el resumen, deberia rechazar la promesa', async () => {
      const promesa = whenPidoElResumen();

      thenSeHizoGetResumen().flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  function whenPidoElResumen(): Promise<ResumenSemanal> {
    return firstValueFrom(service.getResumen());
  }

  function thenSeHizoGetResumen(): TestRequest {
    const req = httpMock.expectOne(URL_RESUMEN);
    expect(req.request.method).toBe('GET');
    return req;
  }
});
