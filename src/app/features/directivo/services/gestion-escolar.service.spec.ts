import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { FranjaHorariaColegio, GradoColegio, NivelColegio } from '../models/gestion-escolar.model';
import { GestionEscolarService } from './gestion-escolar.service';

describe('GestionEscolarService', () => {
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

  it('dado el servicio, cuando pido niveles, deberia hacer GET /niveles', async () => {
    const niveles: NivelColegio[] = [{ id: 'n1', descripcion: 'Primario', activo: true }];

    const promise = service.obtenerNiveles();

    const req = httpMock.expectOne(`${environment.apiUrl}/niveles`);
    expect(req.request.method).toBe('GET');
    req.flush(niveles);

    expect(await promise).toEqual(niveles);
  });

  it('dado includeInactive, cuando listo grados, deberia pedir todos los grados del colegio', async () => {
    const grados: GradoColegio[] = [grado()];

    const promise = service.listarGrados('school-1', true);

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/grados?includeInactive=true`);
    expect(req.request.method).toBe('GET');
    req.flush(grados);

    expect(await promise).toEqual(grados);
  });

  it('dado un payload, cuando creo grado, deberia hacer POST al colegio', async () => {
    const payload = { nivelId: 'n1', anio: '1', division: 'A' };
    const respuesta = grado();

    const promise = service.crearGrado('school-1', payload);

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/grados`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(respuesta);

    expect(await promise).toEqual(respuesta);
  });

  it('dado un gradeId, cuando edito grado, deberia hacer PUT al detalle', async () => {
    const payload = { nivelId: 'n1', anio: '2', division: 'B' };
    const respuesta = grado({ id: 'g1', anio: '2', division: 'B', nombre: '2 B' });

    const promise = service.editarGrado('school-1', 'g1', payload);

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/grados/g1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(respuesta);

    expect(await promise).toEqual(respuesta);
  });

  it('dado un gradeId, cuando elimino grado, deberia hacer DELETE al detalle', async () => {
    const promise = service.eliminarGrado('school-1', 'g1');

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/grados/g1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expectAsync(promise).toBeResolved();
  });

  it('dado un gradeId, cuando reactivo grado, deberia hacer PATCH a reactivar', async () => {
    const respuesta = grado();

    const promise = service.reactivarGrado('school-1', 'g1');

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/grados/g1/reactivar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(respuesta);

    expect(await promise).toEqual(respuesta);
  });

  it('dado includeInactive, cuando listo franjas, deberia pedir todas y ordenarlas por activas y horaInicio', async () => {
    const franjaTarde = franja({ id: 'f2', horaInicio: '10:00:00' });
    const franjaInactiva = franja({ id: 'f3', activo: false, horaInicio: '08:00:00' });
    const franjaTemprano = franja({ id: 'f1', horaInicio: '09:00:00' });

    const promise = service.listarFranjas('school-1', true);

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/franjas-horarias?includeInactive=true`);
    expect(req.request.method).toBe('GET');
    req.flush([franjaTarde, franjaInactiva, franjaTemprano]);

    expect(await promise).toEqual([franjaTemprano, franjaTarde, franjaInactiva]);
  });

  it('dado un payload, cuando creo franja, deberia hacer POST al colegio', async () => {
    const payload = {
      descripcion: 'Primer recreo',
      horaInicio: '09:30:00',
      horaFin: '09:45:00',
      cupoMaximo: 80,
      minutosCorte: 10,
    };
    const respuesta = franja();

    const promise = service.crearFranja('school-1', payload);

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/franjas-horarias`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(respuesta);

    expect(await promise).toEqual(respuesta);
  });

  it('dado un slotId, cuando edito franja, deberia hacer PUT al detalle', async () => {
    const payload = {
      descripcion: 'Segundo recreo',
      horaInicio: '10:00:00',
      horaFin: '10:15:00',
      cupoMaximo: null,
      minutosCorte: 0,
    };
    const respuesta = franja({ id: 'f1', descripcion: 'Segundo recreo' });

    const promise = service.editarFranja('school-1', 'f1', payload);

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/franjas-horarias/f1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(respuesta);

    expect(await promise).toEqual(respuesta);
  });

  it('dado un slotId, cuando elimino franja, deberia hacer DELETE al detalle', async () => {
    const promise = service.eliminarFranja('school-1', 'f1');

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/franjas-horarias/f1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expectAsync(promise).toBeResolved();
  });

  it('dado un slotId, cuando reactivo franja, deberia hacer PATCH a reactivar', async () => {
    const respuesta = franja();

    const promise = service.reactivarFranja('school-1', 'f1');

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/school-1/franjas-horarias/f1/reactivar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(respuesta);

    expect(await promise).toEqual(respuesta);
  });

  function grado(override: Partial<GradoColegio> = {}): GradoColegio {
    return {
      id: 'g1',
      colegioId: 'school-1',
      nivelId: 'n1',
      nivelDescripcion: 'Primario',
      nombre: '1 A',
      anio: '1',
      division: 'A',
      activo: true,
      ...override,
    };
  }

  function franja(override: Partial<FranjaHorariaColegio> = {}): FranjaHorariaColegio {
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
});

