import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  ColegioAsociadoTutor,
  InvitacionTutor,
  InvitacionTutorPayload,
  ReporteImportacionCsv,
} from '../models/invitacion-tutor.model';
import { InvitacionesTutorService } from './invitaciones-tutor.service';

class InvitacionTutorMother {
  static crear(override: Partial<InvitacionTutor> = {}): InvitacionTutor {
    return {
      id: 'inv-1',
      schoolId: 'school-1',
      schoolName: 'Colegio Central',
      email: 'tutor@example.com',
      firstName: 'Ana',
      lastName: 'Perez',
      phone: '011-4444',
      status: 'PENDING',
      expiresAt: '2026-12-31T00:00:00Z',
      invitationLink: 'https://recred.app/invitacion/token',
      result: 'CREATED',
      ...override,
    };
  }
}

class ReporteImportacionCsvMother {
  static crear(override: Partial<ReporteImportacionCsv> = {}): ReporteImportacionCsv {
    return {
      totalRows: 3,
      createdInvitations: 2,
      resentInvitations: 0,
      alreadyAssociated: 1,
      errors: [],
      ...override,
    };
  }
}

describe('InvitacionesTutorService', () => {
  const API = environment.apiUrl;
  const URL_INVITAR = `${API}/colegio/tutores/invitaciones`;
  const URL_IMPORTAR = `${API}/colegio/tutores/invitaciones/import`;
  const URL_VALIDAR = (token: string): string => `${API}/invitaciones/tutor/${encodeURIComponent(token)}`;
  const URL_PREPARAR = (token: string): string => `${API}/invitaciones/tutor/${encodeURIComponent(token)}/preparar-cuenta`;
  const URL_ACEPTAR = (token: string): string => `${API}/invitaciones/tutor/${encodeURIComponent(token)}/aceptar`;
  const URL_COLEGIOS = `${API}/tutores/me/colegios`;

  let service: InvitacionesTutorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InvitacionesTutorService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InvitacionesTutorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('invitarTutor', () => {
    it('dado un payload valido, cuando invito, deberia hacer POST con el payload y devolver la invitacion', async () => {
      const payload: InvitacionTutorPayload = {
        email: 'tutor@example.com',
        firstName: 'Ana',
        lastName: 'Perez',
        phone: '011-1111',
      };
      const response = InvitacionTutorMother.crear();

      const promesa = service.invitarTutor(payload);
      const req = httpMock.expectOne(URL_INVITAR);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(response);

      await expectAsync(promesa).toBeResolvedTo(response);
    });
  });

  describe('importarCsv', () => {
    it('dado un archivo, cuando importo, deberia hacer POST /import con FormData y file adjunto', async () => {
      const archivo = new File(['a,b,c'], 'tutores.csv', { type: 'text/csv' });
      const response = ReporteImportacionCsvMother.crear();

      const promesa = service.importarCsv(archivo);
      const req = httpMock.expectOne(URL_IMPORTAR);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      const formData = req.request.body as FormData;
      expect(formData.get('file')).toBe(archivo);
      req.flush(response);

      await expectAsync(promesa).toBeResolvedTo(response);
    });
  });

  describe('validarToken', () => {
    it('dado un token, cuando valido, deberia hacer GET a la url con el token codificado', async () => {
      const token = 'token/con-espacios y raros';
      const response = InvitacionTutorMother.crear();

      const promesa = service.validarToken(token);
      const req = httpMock.expectOne(URL_VALIDAR(token));
      expect(req.request.method).toBe('GET');
      req.flush(response);

      await expectAsync(promesa).toBeResolvedTo(response);
    });
  });

  describe('aceptarInvitacion', () => {
    it('dado un token, cuando acepto, deberia hacer POST a la url con /aceptar', async () => {
      const promesa = service.aceptarInvitacion('token-abc');
      const req = httpMock.expectOne(URL_ACEPTAR('token-abc'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(null);

      await expectAsync(promesa).toBeResolved();
    });
  });

  describe('prepararCuenta', () => {
    it('dado un token, cuando preparo cuenta, deberia hacer POST a la url con /preparar-cuenta', async () => {
      const response = {
        invitationId: 'inv-1',
        schoolId: 'school-1',
        schoolName: 'Colegio Central',
        email: 'tutor@example.com',
        result: 'LOGIN_REQUIRED' as const,
      };

      const promesa = service.prepararCuenta('token-abc');
      const req = httpMock.expectOne(URL_PREPARAR('token-abc'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(response);

      await expectAsync(promesa).toBeResolvedTo(response);
    });

    it('dado un username, cuando preparo cuenta, deberia enviarlo en el body', async () => {
      const response = {
        invitationId: 'inv-1',
        schoolId: 'school-1',
        schoolName: 'Colegio Central',
        email: 'tutor@example.com',
        result: 'ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT' as const,
      };

      const promesa = service.prepararCuenta('token-abc', 'arruaclotilde');
      const req = httpMock.expectOne(URL_PREPARAR('token-abc'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'arruaclotilde' });
      req.flush(response);

      await expectAsync(promesa).toBeResolvedTo(response);
    });
  });

  describe('obtenerColegiosDelTutor', () => {
    it('cuando pido los colegios, deberia hacer GET /tutores/me/colegios', async () => {
      const colegios: ColegioAsociadoTutor[] = [
        { id: 'col-1', nombre: 'Colegio A' },
        { id: 'col-2', nombre: 'Colegio B' },
      ];

      const promesa = service.obtenerColegiosDelTutor();
      const req = httpMock.expectOne(URL_COLEGIOS);
      expect(req.request.method).toBe('GET');
      req.flush(colegios);

      await expectAsync(promesa).toBeResolvedTo(colegios);
    });
  });
});
