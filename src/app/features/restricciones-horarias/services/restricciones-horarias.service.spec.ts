import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RestriccionesHorariasService } from './restricciones-horarias.service';
import { RestriccionHoraria, TimeRestrictionCommand } from '../models/restriccion-horaria.model';
import { environment } from '../../../../environments/environment';

describe('RestriccionesHorariasService', () => {
  let service: RestriccionesHorariasService;
  let httpMock: HttpTestingController;

  const mockRestriccion: RestriccionHoraria = {
    id: '1',
    studentId: 's1',
    timeSlotId: 't1',
    activa: true
  };

  const mockCommand: TimeRestrictionCommand = {
    studentId: 's1',
    timeSlotId: 't1'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestriccionesHorariasService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RestriccionesHorariasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('dado que consulto restricciones por alumno, deberia hacer GET y retornar datos', fakeAsync(() => {
    let result: RestriccionHoraria[] | undefined;
    service.getRestriccionesPorAlumno('s1').then(res => result = res);

    const req = httpMock.expectOne(`${environment.apiUrl}/time-restrictions/student/s1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockRestriccion]);

    tick();
    expect(result).toEqual([mockRestriccion]);
  }));

  it('dado que la peticion GET falla, deberia lanzar el error', fakeAsync(() => {
    let error: any;
    service.getRestriccionesPorAlumno('s1').catch(err => error = err);

    const req = httpMock.expectOne(`${environment.apiUrl}/time-restrictions/student/s1`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    tick();
    expect(error).toBeDefined();
    expect(error.status).toBe(500);
  }));

  it('dado que creo una restriccion, deberia hacer POST', fakeAsync(() => {
    let result: RestriccionHoraria | undefined;
    service.crearRestriccion(mockCommand).then(res => result = res);

    const req = httpMock.expectOne(`${environment.apiUrl}/time-restrictions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCommand);
    req.flush(mockRestriccion);

    tick();
    expect(result).toEqual(mockRestriccion);
  }));

  it('dado que actualizo una restriccion, deberia hacer PUT', fakeAsync(() => {
    let result: RestriccionHoraria | undefined;
    service.actualizarRestriccion('1', mockCommand).then(res => result = res);

    const req = httpMock.expectOne(`${environment.apiUrl}/time-restrictions/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockRestriccion);

    tick();
    expect(result).toEqual(mockRestriccion);
  }));

  it('dado que deshabilito una restriccion, deberia hacer PATCH', fakeAsync(() => {
    let finished = false;
    service.deshabilitarRestriccion('1').then(() => finished = true);

    const req = httpMock.expectOne(`${environment.apiUrl}/time-restrictions/1/disable`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    tick();
    expect(finished).toBeTrue();
  }));
});
