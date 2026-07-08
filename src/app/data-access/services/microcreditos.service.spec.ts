import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MicrocreditosService, SchoolCredit } from './microcreditos.service';

describe('MicrocreditosService', () => {
  const BASE = `${environment.apiUrl}/school-credits`;

  let service: MicrocreditosService;
  let httpMock: HttpTestingController;

  class SchoolCreditMother {
    static crear(override: Partial<SchoolCredit> = {}): SchoolCredit {
      return {
        id: 'c-1',
        studentId: 'alumno-1',
        amount: 1000,
        installments: 3,
        status: 'ACTIVE',
        createdAt: '2026-07-01T00:00:00Z',
        ...override,
      };
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MicrocreditosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MicrocreditosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('dado un alumno, padre, monto y cuotas, cuando pido un credito, deberia hacer POST /school-credits con esos cuatro valores en el body', async () => {
    const respuesta = SchoolCreditMother.crear();

    const promesa = whenPidoCredito('alumno-1', 'padre-1', 1000, 3);

    thenSeLlamaPOSTCreditoCon('alumno-1', 'padre-1', 1000, 3).flush(respuesta);

    expect(await promesa).toEqual(respuesta);
  });

  it('dado un alumnoId, cuando pido la ultima recarga, deberia hacer GET /school-credits/alumno/{id}/last-recharge', async () => {
    const promesa = firstValueFrom(service.getLastRecharge('alumno-1'));
    const req = httpMock.expectOne(`${BASE}/alumno/alumno-1/last-recharge`);

    expect(req.request.method).toBe('GET');
    req.flush(500);

    expect(await promesa).toBe(500);
  });

  it('dado un alumnoId, cuando pido el credito activo, deberia hacer GET /school-credits/alumno/{id}/active', async () => {
    const promesa = firstValueFrom(service.getActiveCredit('alumno-1'));
    const req = httpMock.expectOne(`${BASE}/alumno/alumno-1/active`);

    expect(req.request.method).toBe('GET');
    req.flush(null);

    expect(await promesa).toBeNull();
  });

  it('dado un creditoId, cuando pago, deberia hacer POST /school-credits/{creditId}/pay con body vacio', async () => {
    const promesa = firstValueFrom(service.payCredit('credito-1'));
    const req = httpMock.expectOne(`${BASE}/credito-1/pay`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 'credito-1', status: 'PAID' });

    await promesa;
  });

  it('dado un alumnoId, cuando pido el historial, deberia hacer GET /school-credits/alumno/{id}', async () => {
    const promesa = firstValueFrom(service.getHistory('alumno-1'));
    const req = httpMock.expectOne(`${BASE}/alumno/alumno-1`);

    expect(req.request.method).toBe('GET');
    req.flush([]);

    expect(await promesa).toEqual([]);
  });

  function whenPidoCredito(studentId: string, parentId: string, amount: number, installments: number): Promise<SchoolCredit> {
    return firstValueFrom(service.requestCredit(studentId, parentId, amount, installments));
  }

  function thenSeLlamaPOSTCreditoCon(studentId: string, parentId: string, amount: number, installments: number): TestRequest {
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.studentId).toBe(studentId);
    expect(req.request.body.parentId).toBe(parentId);
    expect(req.request.body.amount).toBe(amount);
    expect(req.request.body.installments).toBe(installments);
    return req;
  }
});
