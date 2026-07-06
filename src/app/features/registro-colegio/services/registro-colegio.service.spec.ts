import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SchoolRegistrationPayload } from '../models/registro-colegio.model';
import { RegistroColegioMother } from '../registro-colegio.mother';
import { RegistroColegioService } from './registro-colegio.service';

describe('RegistroColegioService', () => {
  const URL_SCHOOL_REGISTRATIONS = `${environment.apiUrl}/school-registrations`;

  let service: RegistroColegioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RegistroColegioService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RegistroColegioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('submitRegistration', () => {
    it('dado un payload valido, cuando lo envio, deberia hacer POST a /school-registrations con el body', async () => {
      const payload = RegistroColegioMother.crearPayload();

      const promesa = whenEnvioElPayload(payload);

      thenSeHizoPOSTRegistrationCon(payload).flush(null);

      await promesa;
    });

    it('dado que el back devuelve error 500, cuando envio, deberia rechazar la promesa', async () => {
      const promesa = whenEnvioElPayload(RegistroColegioMother.crearPayload());

      thenSeHizoPOSTRegistrationSinValidarBody().flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  function whenEnvioElPayload(payload: SchoolRegistrationPayload): Promise<void> {
    return firstValueFrom(service.submitRegistration(payload));
  }

  function thenSeHizoPOSTRegistrationCon(payload: SchoolRegistrationPayload): TestRequest {
    const req = httpMock.expectOne(URL_SCHOOL_REGISTRATIONS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    return req;
  }

  function thenSeHizoPOSTRegistrationSinValidarBody(): TestRequest {
    return httpMock.expectOne(URL_SCHOOL_REGISTRATIONS);
  }
});
