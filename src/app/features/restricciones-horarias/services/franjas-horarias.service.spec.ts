import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { COLEGIO_ID_TEST, TimeSlotMother } from '../restricciones-horarias.mother';
import { FranjasHorariasService } from './franjas-horarias.service';

describe('FranjasHorariasService', () => {
  const URL = `${environment.apiUrl}/colegios/${COLEGIO_ID_TEST}/franjas-horarias`;

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

      const promesa = service.getFranjasHorarias(COLEGIO_ID_TEST);
      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('GET');
      req.flush(franjas);

      expect(await promesa).toEqual(franjas);
    });

    it('dado que el back devuelve error, cuando pido las franjas, deberia rechazar la promesa', async () => {
      spyOn(console, 'error');

      const promesa = service.getFranjasHorarias(COLEGIO_ID_TEST);
      httpMock.expectOne(URL).flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });
});
