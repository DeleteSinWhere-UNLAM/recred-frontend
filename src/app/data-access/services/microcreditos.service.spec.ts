import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MicrocreditosService, SchoolCredit } from './microcreditos.service';

describe('MicrocreditosService', () => {
  const BASE = `${environment.apiUrl}/school-credits`;

  let service: MicrocreditosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MicrocreditosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MicrocreditosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requestCredit hace POST /school-credits con el body', async () => {
    const respuesta: SchoolCredit = {
      id: 'c-1',
      studentId: 'alumno-1',
      amount: 1000,
      installments: 3,
      status: 'ACTIVE',
      createdAt: '2026-07-01T00:00:00Z',
    };

    const promesa = firstValueFrom(service.requestCredit('alumno-1', 'padre-1', 1000, 3));
    const req = httpMock.expectOne(BASE);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      studentId: 'alumno-1',
      parentId: 'padre-1',
      amount: 1000,
      installments: 3,
    });
    req.flush(respuesta);

    expect(await promesa).toEqual(respuesta);
  });

  it('getLastRecharge hace GET /school-credits/alumno/{id}/last-recharge', async () => {
    const promesa = firstValueFrom(service.getLastRecharge('alumno-1'));
    const req = httpMock.expectOne(`${BASE}/alumno/alumno-1/last-recharge`);

    expect(req.request.method).toBe('GET');
    req.flush(500);

    expect(await promesa).toBe(500);
  });

  it('getActiveCredit hace GET /school-credits/alumno/{id}/active', async () => {
    const promesa = firstValueFrom(service.getActiveCredit('alumno-1'));
    const req = httpMock.expectOne(`${BASE}/alumno/alumno-1/active`);

    expect(req.request.method).toBe('GET');
    req.flush(null);

    expect(await promesa).toBeNull();
  });

  it('payCredit hace POST /school-credits/{creditId}/pay con body vacio', async () => {
    const promesa = firstValueFrom(service.payCredit('credito-1'));
    const req = httpMock.expectOne(`${BASE}/credito-1/pay`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 'credito-1', status: 'PAID' });

    await promesa;
  });

  it('getHistory hace GET /school-credits/alumno/{id}', async () => {
    const promesa = firstValueFrom(service.getHistory('alumno-1'));
    const req = httpMock.expectOne(`${BASE}/alumno/alumno-1`);

    expect(req.request.method).toBe('GET');
    req.flush([]);

    expect(await promesa).toEqual([]);
  });
});
