import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ALUMNO_NO_UUID,
  ALUMNO_UUID_TEST,
  MovimientoMother,
} from '../movimientos.mother';
import { MovimientosService } from './movimientos.service';

describe('MovimientosService', () => {
  const PURCHASES = `${environment.apiUrl}/purchases`;

  let service: MovimientosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MovimientosService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MovimientosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getHistorialAlumno', () => {
    it('dado un alumnoId UUID, cuando pido el historial, deberia hacer GET al endpoint del alumno', async () => {
      const historial = [MovimientoMother.crear()];

      const promesa = firstValueFrom(service.getHistorialAlumno(ALUMNO_UUID_TEST));
      const req = httpMock.expectOne(`${PURCHASES}/alumno/${ALUMNO_UUID_TEST}`);
      expect(req.request.method).toBe('GET');
      req.flush(historial);

      expect((await promesa).length).toBe(1);
    });

    it('dado un alumnoId no UUID, cuando pido el historial, deberia devolver el mock sin llamar al back', async () => {
      const historial = await firstValueFrom(service.getHistorialAlumno(ALUMNO_NO_UUID));

      expect(historial.length).toBeGreaterThan(0);
      expect(historial[0].studentId).toBe(ALUMNO_NO_UUID);
      httpMock.expectNone(`${PURCHASES}/alumno/${ALUMNO_NO_UUID}`);
    });
  });

  describe('getPendientesAlumno', () => {
    it('dado un alumnoId UUID, cuando pido pendientes, deberia hacer GET al endpoint de pendientes', async () => {
      const promesa = firstValueFrom(service.getPendientesAlumno(ALUMNO_UUID_TEST));
      const req = httpMock.expectOne(`${PURCHASES}/alumno/${ALUMNO_UUID_TEST}/pendientes`);
      expect(req.request.method).toBe('GET');
      req.flush([MovimientoMother.crearPendiente()]);

      const pendientes = await promesa;
      expect(pendientes.length).toBe(1);
    });

    it('dado un alumnoId no UUID, cuando pido pendientes, deberia devolver solo mocks con status pendiente/en_preparacion/listo', async () => {
      const pendientes = await firstValueFrom(service.getPendientesAlumno(ALUMNO_NO_UUID));

      const estadosValidos = ['PENDING', 'EN_PREPARACION', 'LISTO'];
      expect(pendientes.every((m) => estadosValidos.includes(m.status))).toBeTrue();
    });
  });

  describe('getHistorialTutor', () => {
    it('dado el tutor logueado, cuando pido su historial, deberia hacer GET a /purchases/tutor/me', async () => {
      const promesa = firstValueFrom(service.getHistorialTutor());
      const req = httpMock.expectOne(`${PURCHASES}/tutor/me`);
      expect(req.request.method).toBe('GET');
      req.flush([MovimientoMother.crear()]);

      expect((await promesa).length).toBe(1);
    });
  });

  describe('cancelarCompra', () => {
    it('dado un id de compra, cuando cancelo, deberia hacer PUT /purchases/{id}/cancel con body vacio', async () => {
      const promesa = firstValueFrom(service.cancelarCompra('compra-1'));
      const req = httpMock.expectOne(`${PURCHASES}/compra-1/cancel`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(null);
      await promesa;
    });
  });
});
