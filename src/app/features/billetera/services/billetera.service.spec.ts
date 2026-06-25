import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { BilleteraService } from './billetera.service';
import { BilleteraResumen } from '../models/billetera.model';

describe('BilleteraService', () => {
  let service: BilleteraService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BilleteraService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(BilleteraService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('getResumen debería enviar el rango de fechas como query params', () => {
    let resultado: BilleteraResumen | undefined;

    service.getResumen('alumno-1', '2026-06-01', '2026-06-14').subscribe((r) => {
      resultado = r;
    });

    const req = httpMock.expectOne(
      (request) =>
        request.method === 'GET' &&
        request.url === `${environment.apiUrl}/wallets/students/alumno-1/summary`,
    );

    expect(req.request.params.get('desde')).toBe('2026-06-01');
    expect(req.request.params.get('hasta')).toBe('2026-06-14');

    const mock: BilleteraResumen = {
      alumnoId: 'alumno-1',
      saldoActual: 1250,
      periodo: { desde: '2026-06-01', hasta: '2026-06-14' },
      montoIngresado: 3000,
      montoGastado: 1750,
      balancePeriodo: 1250,
      cantidadCompras: 8,
      gastoPorCategoria: [],
      gastoPorClasificacionSalud: [],
      movimientos: [],
    };
    req.flush(mock);

    expect(resultado).toEqual(mock);
  });

  it('getResumen debería omitir el rango cuando no se informa', () => {
    service.getResumen('alumno-1').subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}/wallets/students/alumno-1/summary`,
    );
    expect(req.request.params.has('desde')).toBeFalse();
    expect(req.request.params.has('hasta')).toBeFalse();
    req.flush({});
  });
});
