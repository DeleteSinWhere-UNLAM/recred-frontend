import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FranjasHorariasService } from './franjas-horarias.service';
import { TimeSlot } from '../models/restriccion-horaria.model';
import { environment } from '../../../../environments/environment';

describe('FranjasHorariasService', () => {
  let service: FranjasHorariasService;
  let httpMock: HttpTestingController;

  const mockTimeSlot: TimeSlot = {
    id: 'ts1',
    descripcion: 'Recreo 1',
    horaInicio: '10:00',
    horaFin: '10:15',
    colegioId: 'c1',
    activo: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FranjasHorariasService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(FranjasHorariasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('dado que consulto franjas horarias, deberia hacer GET y retornar datos', fakeAsync(() => {
    let result: TimeSlot[] | undefined;
    service.getFranjasHorarias('c1').then(res => result = res);

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/c1/franjas-horarias`);
    expect(req.request.method).toBe('GET');
    req.flush([mockTimeSlot]);

    tick();
    expect(result).toEqual([mockTimeSlot]);
  }));

  it('dado que falla la peticion, deberia lanzar error', fakeAsync(() => {
    service.getFranjasHorarias('c1').catch((error: import('@angular/common/http').HttpErrorResponse) => {
      expect(error).toBeDefined();
      expect(error.status).toBe(500);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/c1/franjas-horarias`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    tick();
  }));
});
