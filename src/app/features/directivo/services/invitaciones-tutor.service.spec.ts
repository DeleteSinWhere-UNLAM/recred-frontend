import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  ColegioAsociadoTutor,
  InvitacionTutor,
  InvitacionTutorPayload,
  PreparacionCuentaTutor,
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

class PreparacionCuentaTutorMother {
  static crearLoginRequired(): PreparacionCuentaTutor {
    return {
      invitationId: 'inv-1',
      schoolId: 'school-1',
      schoolName: 'Colegio Central',
      email: 'tutor@example.com',
      result: 'LOGIN_REQUIRED',
    };
  }

  static crearAccountCreated(): PreparacionCuentaTutor {
    return {
      invitationId: 'inv-1',
      schoolId: 'school-1',
      schoolName: 'Colegio Central',
      email: 'tutor@example.com',
      result: 'ACCOUNT_CREATED_TEMPORARY_PASSWORD_SENT',
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

      const promesa = whenInvitoTutor(payload);

      thenSeHizoPostA(URL_INVITAR, payload).flush(response);
      await thenLaPromesaResuelveA(promesa, response);
    });
  });

  describe('importarCsv', () => {
    it('dado un archivo, cuando importo, deberia hacer POST /import con FormData y file adjunto', async () => {
      const archivo = new File(['a,b,c'], 'tutores.csv', { type: 'text/csv' });
      const response = ReporteImportacionCsvMother.crear();

      const promesa = whenImportoCsv(archivo);

      const req = thenSeHizoPost(URL_IMPORTAR);
      thenElBodyEsFormDataConFile(req, archivo);
      req.flush(response);
      await thenLaPromesaResuelveA(promesa, response);
    });
  });

  describe('validarToken', () => {
    it('dado un token, cuando valido, deberia hacer GET a la url con el token codificado', async () => {
      const token = 'token/con-espacios y raros';
      const response = InvitacionTutorMother.crear();

      const promesa = whenValidoToken(token);

      thenSeHizoGetA(URL_VALIDAR(token)).flush(response);
      await thenLaPromesaResuelveA(promesa, response);
    });
  });

  describe('aceptarInvitacion', () => {
    it('dado un token, cuando acepto, deberia hacer POST a la url con /aceptar', async () => {
      const promesa = whenAceptoInvitacion('token-abc');

      thenSeHizoPostA(URL_ACEPTAR('token-abc'), null).flush(null);
      await expectAsync(promesa).toBeResolved();
    });
  });

  describe('prepararCuenta', () => {
    it('dado un token, cuando preparo cuenta, deberia hacer POST a la url con /preparar-cuenta', async () => {
      const response = PreparacionCuentaTutorMother.crearLoginRequired();

      const promesa = whenPreparoCuenta('token-abc');

      thenSeHizoPostA(URL_PREPARAR('token-abc'), null).flush(response);
      await thenLaPromesaResuelveA(promesa, response);
    });

    it('dado un username, cuando preparo cuenta, deberia enviarlo en el body', async () => {
      const response = PreparacionCuentaTutorMother.crearAccountCreated();

      const promesa = whenPreparoCuenta('token-abc', 'arruaclotilde');

      thenSeHizoPostA(URL_PREPARAR('token-abc'), { username: 'arruaclotilde' }).flush(response);
      await thenLaPromesaResuelveA(promesa, response);
    });
  });

  describe('obtenerColegiosDelTutor', () => {
    it('cuando pido los colegios, deberia hacer GET /tutores/me/colegios', async () => {
      const colegios: ColegioAsociadoTutor[] = [
        { id: 'col-1', nombre: 'Colegio A' },
        { id: 'col-2', nombre: 'Colegio B' },
      ];

      const promesa = whenObtengoColegiosDelTutor();

      thenSeHizoGetA(URL_COLEGIOS).flush(colegios);
      await thenLaPromesaResuelveA(promesa, colegios);
    });
  });

  function whenInvitoTutor(payload: InvitacionTutorPayload): Promise<InvitacionTutor> {
    return service.invitarTutor(payload);
  }

  function whenImportoCsv(archivo: File): Promise<ReporteImportacionCsv> {
    return service.importarCsv(archivo);
  }

  function whenValidoToken(token: string): Promise<InvitacionTutor> {
    return service.validarToken(token);
  }

  function whenAceptoInvitacion(token: string): Promise<void> {
    return service.aceptarInvitacion(token);
  }

  function whenPreparoCuenta(token: string, username?: string): Promise<PreparacionCuentaTutor> {
    return service.prepararCuenta(token, username);
  }

  function whenObtengoColegiosDelTutor(): Promise<ColegioAsociadoTutor[]> {
    return service.obtenerColegiosDelTutor();
  }

  function thenSeHizoGetA(url: string): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoPost(url: string): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    return req;
  }

  function thenSeHizoPostA(url: string, body: unknown): TestRequest {
    const req = thenSeHizoPost(url);
    expect(req.request.body).toEqual(body as never);
    return req;
  }

  function thenElBodyEsFormDataConFile(req: TestRequest, archivo: File): void {
    expect(req.request.body instanceof FormData).toBeTrue();
    const formData = req.request.body as FormData;
    expect(formData.get('file')).toBe(archivo);
  }

  async function thenLaPromesaResuelveA<T>(promise: Promise<T>, esperado: T): Promise<void> {
    await expectAsync(promise).toBeResolvedTo(esperado);
  }
});
