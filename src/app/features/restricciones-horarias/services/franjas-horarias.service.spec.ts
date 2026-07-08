import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { TimeSlot } from '../models/restriccion-horaria.model';
import { COLEGIO_ID_TEST, TimeSlotMother } from '../restricciones-horarias.mother';
import { FranjasHorariasService } from './franjas-horarias.service';

describe('FranjasHorariasService', () => {
  const URL_FRANJAS = (colegioId: string): string =>
    `${environment.apiUrl}/colegios/${colegioId}/franjas-horarias`;

  let service: FranjasHorariasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FranjasHorariasService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(FranjasHorariasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getFranjasHorarias', () => {
    it('dado un colegioId, cuando pido las franjas, deberia hacer GET a /colegios/{id}/franjas-horarias', async () => {
      const franjas = TimeSlotMother.crearVarios();

      const promesa = whenPidoFranjasDe(COLEGIO_ID_TEST);

      thenSeHizoGetFranjasDe(COLEGIO_ID_TEST).flush(franjas);

      expect(await promesa).toEqual(franjas);
    });

    it('dado que el back devuelve error, cuando pido las franjas, deberia rechazar la promesa', async () => {
      spyOn(console, 'error');

      const promesa = whenPidoFranjasDe(COLEGIO_ID_TEST);

      thenSeHizoGetFranjasDe(COLEGIO_ID_TEST).flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  function whenPidoFranjasDe(colegioId: string): Promise<TimeSlot[]> {
    return service.getFranjasHorarias(colegioId);
  }

  function thenSeHizoGetFranjasDe(colegioId: string): TestRequest {
    const req = httpMock.expectOne(URL_FRANJAS(colegioId));
    expect(req.request.method).toBe('GET');
    return req;
  }
});
