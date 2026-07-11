import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { FranjaHorariaColegio, GradoColegio, NivelColegio } from '../models/gestion-escolar.model';
import { GestionEscolarService } from './gestion-escolar.service';

class GradoColegioMother {
  static crear(override: Partial<GradoColegio> = {}): GradoColegio {
    return {
      id: 'g1',
      colegioId: 'school-1',
      nivelId: 'n1',
      nivelDescripcion: 'Primario',
      nombre: '1 A',
      año: '1',
      division: 'A',
      activo: true,
      ...override,
    };
  }
}

class FranjaHorariaColegioMother {
  static crear(override: Partial<FranjaHorariaColegio> = {}): FranjaHorariaColegio {
    return {
      id: 'f1',
      colegioId: 'school-1',
      descripcion: 'Primer recreo',
      horaInicio: '09:30:00',
      horaFin: '09:45:00',
      activo: true,
      cupoMaximo: 80,
      minutosCorte: 10,
      ...override,
    };
  }
}

describe('GestionEscolarService', () => {
  const SCHOOL_ID = 'school-1';
  const URL_NIVELES = `${environment.apiUrl}/niveles`;
  const urlGrados = (schoolId: string, query = '') =>
    `${environment.apiUrl}/colegios/${schoolId}/grados${query}`;
  const urlGrado = (schoolId: string, gradeId: string) =>
    `${environment.apiUrl}/colegios/${schoolId}/grados/${gradeId}`;
  const urlFranjas = (schoolId: string, query = '') =>
    `${environment.apiUrl}/colegios/${schoolId}/franjas-horarias${query}`;
  const urlFranja = (schoolId: string, slotId: string) =>
    `${environment.apiUrl}/colegios/${schoolId}/franjas-horarias/${slotId}`;

  let service: GestionEscolarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GestionEscolarService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GestionEscolarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('niveles', () => {
    it('dado el servicio, cuando pido niveles, deberia hacer GET /niveles', async () => {
      const niveles: NivelColegio[] = [{ id: 'n1', descripcion: 'Primario', activo: true }];

      const promise = whenObtengoNiveles();

      thenSeHizoGet(URL_NIVELES).flush(niveles);
      expect(await promise).toEqual(niveles);
    });
  });

  describe('grados', () => {
    it('dado includeInactive, cuando listo grados, deberia pedir todos los grados del colegio', async () => {
      const grados = [GradoColegioMother.crear()];

      const promise = whenListoGrados(SCHOOL_ID, true);

      thenSeHizoGet(urlGrados(SCHOOL_ID, '?includeInactive=true')).flush(grados);
      expect(await promise).toEqual(grados);
    });

    it('dado sin includeInactive, cuando listo grados, no deberia enviar el query param', async () => {
      const promise = whenListoGrados(SCHOOL_ID);

      const req = thenSeHizoGet(urlGrados(SCHOOL_ID));
      expect(req.request.params.has('includeInactive')).toBeFalse();
      req.flush([]);
      await promise;
    });

    it('dado un payload, cuando creo grado, deberia hacer POST al colegio', async () => {
      const payload = { nivelId: 'n1', año: '1', division: 'A' };
      const respuesta = GradoColegioMother.crear();

      const promise = whenCreoGrado(SCHOOL_ID, payload);

      thenSeHizoPostA(urlGrados(SCHOOL_ID), {
        nivelId: 'n1',
        anio: '1',
        division: 'A',
      }).flush(respuesta);
      expect(await promise).toEqual(respuesta);
    });

    it('dado un gradeId, cuando edito grado, deberia hacer PUT al detalle', async () => {
      const payload = { nivelId: 'n1', año: '2', division: 'B' };
      const respuesta = GradoColegioMother.crear({ id: 'g1', año: '2', division: 'B', nombre: '2 B' });

      const promise = whenEditoGrado(SCHOOL_ID, 'g1', payload);

      thenSeHizoPutA(urlGrado(SCHOOL_ID, 'g1'), {
        nivelId: 'n1',
        anio: '2',
        division: 'B',
      }).flush(respuesta);
      expect(await promise).toEqual(respuesta);
    });

    it('dado un gradeId, cuando elimino grado, deberia hacer DELETE al detalle', async () => {
      const promise = whenEliminoGrado(SCHOOL_ID, 'g1');

      thenSeHizoDeleteA(urlGrado(SCHOOL_ID, 'g1')).flush(null);
      await expectAsync(promise).toBeResolved();
    });

    it('dado un gradeId, cuando reactivo grado, deberia hacer PATCH a reactivar', async () => {
      const respuesta = GradoColegioMother.crear();

      const promise = whenReactivoGrado(SCHOOL_ID, 'g1');

      thenSeHizoPatchA(`${urlGrado(SCHOOL_ID, 'g1')}/reactivar`, {}).flush(respuesta);
      expect(await promise).toEqual(respuesta);
    });

    it('dado un gradeId, cuando pido el detalle del grado, deberia hacer GET al detalle', async () => {
      const respuesta = GradoColegioMother.crear({ id: 'g1' });

      const promise = whenObtengoGrado(SCHOOL_ID, 'g1');

      thenSeHizoGet(urlGrado(SCHOOL_ID, 'g1')).flush(respuesta);
      expect(await promise).toEqual(respuesta);
    });
  });

  describe('franjas horarias', () => {
    it('dado includeInactive, cuando listo franjas, deberia pedir todas y ordenarlas por activas y horaInicio', async () => {
      const franjaTarde = FranjaHorariaColegioMother.crear({ id: 'f2', horaInicio: '10:00:00' });
      const franjaInactiva = FranjaHorariaColegioMother.crear({
        id: 'f3',
        activo: false,
        horaInicio: '08:00:00',
      });
      const franjaTemprano = FranjaHorariaColegioMother.crear({ id: 'f1', horaInicio: '09:00:00' });

      const promise = whenListoFranjas(SCHOOL_ID, true);

      thenSeHizoGet(urlFranjas(SCHOOL_ID, '?includeInactive=true')).flush([
        franjaTarde,
        franjaInactiva,
        franjaTemprano,
      ]);
      expect(await promise).toEqual([franjaTemprano, franjaTarde, franjaInactiva]);
    });

    it('dado sin includeInactive, cuando listo franjas, no deberia enviar el query param', async () => {
      const promise = whenListoFranjas(SCHOOL_ID);

      const req = thenSeHizoGet(urlFranjas(SCHOOL_ID));
      expect(req.request.params.has('includeInactive')).toBeFalse();
      req.flush([]);
      expect(await promise).toEqual([]);
    });

    it('dado un payload, cuando creo franja, deberia hacer POST al colegio', async () => {
      const payload = { descripcion: 'Primer recreo', horaInicio: '09:30:00', horaFin: '09:45:00' };
      const respuesta = FranjaHorariaColegioMother.crear();

      const promise = whenCreoFranja(SCHOOL_ID, payload);

      thenSeHizoPostA(urlFranjas(SCHOOL_ID), payload).flush(respuesta);
      expect(await promise).toEqual(respuesta);
    });

    it('dado un slotId, cuando edito franja, deberia hacer PUT al detalle', async () => {
      const payload = { descripcion: 'Segundo recreo', horaInicio: '10:00:00', horaFin: '10:15:00' };
      const respuesta = FranjaHorariaColegioMother.crear({ id: 'f1', descripcion: 'Segundo recreo' });

      const promise = whenEditoFranja(SCHOOL_ID, 'f1', payload);

      thenSeHizoPutA(urlFranja(SCHOOL_ID, 'f1'), payload).flush(respuesta);
      expect(await promise).toEqual(respuesta);
    });

    it('dado un slotId, cuando elimino franja, deberia hacer DELETE al detalle', async () => {
      const promise = whenEliminoFranja(SCHOOL_ID, 'f1');

      thenSeHizoDeleteA(urlFranja(SCHOOL_ID, 'f1')).flush(null);
      await expectAsync(promise).toBeResolved();
    });

    it('dado un slotId, cuando reactivo franja, deberia hacer PATCH a reactivar', async () => {
      const respuesta = FranjaHorariaColegioMother.crear();

      const promise = whenReactivoFranja(SCHOOL_ID, 'f1');

      thenSeHizoPatchA(`${urlFranja(SCHOOL_ID, 'f1')}/reactivar`, {}).flush(respuesta);
      expect(await promise).toEqual(respuesta);
    });

    it('dado un slotId, cuando pido el detalle de la franja, deberia hacer GET al detalle', async () => {
      const respuesta = FranjaHorariaColegioMother.crear({ id: 'f1' });

      const promise = whenObtengoFranja(SCHOOL_ID, 'f1');

      thenSeHizoGet(urlFranja(SCHOOL_ID, 'f1')).flush(respuesta);
      expect(await promise).toEqual(respuesta);
    });
  });

  function whenObtengoNiveles(): Promise<NivelColegio[]> {
    return service.obtenerNiveles();
  }

  function whenListoGrados(schoolId: string, includeInactive?: boolean): Promise<GradoColegio[]> {
    return service.listarGrados(schoolId, includeInactive);
  }

  function whenObtengoGrado(schoolId: string, gradeId: string): Promise<GradoColegio> {
    return service.obtenerGrado(schoolId, gradeId);
  }

  function whenCreoGrado(
    schoolId: string,
    payload: Parameters<GestionEscolarService['crearGrado']>[1],
  ): Promise<GradoColegio> {
    return service.crearGrado(schoolId, payload);
  }

  function whenEditoGrado(
    schoolId: string,
    gradeId: string,
    payload: Parameters<GestionEscolarService['editarGrado']>[2],
  ): Promise<GradoColegio> {
    return service.editarGrado(schoolId, gradeId, payload);
  }

  function whenEliminoGrado(schoolId: string, gradeId: string): Promise<void> {
    return service.eliminarGrado(schoolId, gradeId);
  }

  function whenReactivoGrado(schoolId: string, gradeId: string): Promise<GradoColegio> {
    return service.reactivarGrado(schoolId, gradeId);
  }

  function whenListoFranjas(
    schoolId: string,
    includeInactive?: boolean,
  ): Promise<FranjaHorariaColegio[]> {
    return service.listarFranjas(schoolId, includeInactive);
  }

  function whenObtengoFranja(schoolId: string, slotId: string): Promise<FranjaHorariaColegio> {
    return service.obtenerFranja(schoolId, slotId);
  }

  function whenCreoFranja(
    schoolId: string,
    payload: Parameters<GestionEscolarService['crearFranja']>[1],
  ): Promise<FranjaHorariaColegio> {
    return service.crearFranja(schoolId, payload);
  }

  function whenEditoFranja(
    schoolId: string,
    slotId: string,
    payload: Parameters<GestionEscolarService['editarFranja']>[2],
  ): Promise<FranjaHorariaColegio> {
    return service.editarFranja(schoolId, slotId, payload);
  }

  function whenEliminoFranja(schoolId: string, slotId: string): Promise<void> {
    return service.eliminarFranja(schoolId, slotId);
  }

  function whenReactivoFranja(schoolId: string, slotId: string): Promise<FranjaHorariaColegio> {
    return service.reactivarFranja(schoolId, slotId);
  }

  function thenSeHizoGet(url: string): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoPostA(url: string, body: unknown): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    return req;
  }

  function thenSeHizoPutA(url: string, body: unknown): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    return req;
  }

  function thenSeHizoDeleteA(url: string): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('DELETE');
    return req;
  }

  function thenSeHizoPatchA(url: string, body: unknown): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    return req;
  }
});
