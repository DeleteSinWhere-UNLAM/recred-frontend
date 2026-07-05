import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SchoolRegistration } from '../models/solicitud-colegio.model';
import { RecredAdminMother } from '../recred-admin.mother';
import { RecredAdminService } from './recred-admin.service';

describe('RecredAdminService', () => {
  const URL_PENDING = `${environment.apiUrl}/school-registrations?status=PENDING`;
  const URL_APPROVE = (id: string): string => `${environment.apiUrl}/school-registrations/${id}/approve`;
  const URL_REJECT = (id: string): string => `${environment.apiUrl}/school-registrations/${id}/reject`;

  let service: RecredAdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecredAdminService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecredAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getPendingRegistrations', () => {
    it('cuando pido las solicitudes pendientes, deberia hacer GET a /school-registrations?status=PENDING', async () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();

      const promesa = whenPidoSolicitudesPendientes();
      const req = httpMock.expectOne(URL_PENDING);
      expect(req.request.method).toBe('GET');
      req.flush(solicitudes);

      expect(await promesa).toEqual(solicitudes);
    });

    it('dado que el back devuelve error, cuando pido las solicitudes, deberia rechazar la promesa', async () => {
      const promesa = whenPidoSolicitudesPendientes();
      httpMock.expectOne(URL_PENDING).flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  describe('approveRegistration', () => {
    it('dado un id, cuando apruebo, deberia hacer POST a /school-registrations/{id}/approve con body vacio', async () => {
      const promesa = firstValueFrom(service.approveRegistration('solicitud-1'));
      const req = httpMock.expectOne(URL_APPROVE('solicitud-1'));

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);

      await promesa;
    });
  });

  describe('rejectRegistration', () => {
    it('dado un id, cuando rechazo, deberia hacer POST a /school-registrations/{id}/reject con body vacio', async () => {
      const promesa = firstValueFrom(service.rejectRegistration('solicitud-2'));
      const req = httpMock.expectOne(URL_REJECT('solicitud-2'));

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);

      await promesa;
    });
  });

  function whenPidoSolicitudesPendientes(): Promise<SchoolRegistration[]> {
    return firstValueFrom(service.getPendingRegistrations());
  }
});
