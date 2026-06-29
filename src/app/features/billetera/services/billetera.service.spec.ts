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

  const ALUMNO_ID = 'alumno-1';
  const DESDE = '2026-06-01';
  const HASTA = '2026-06-14';

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

  it('dado que se inyecta el servicio, deberia crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('dado un alumno y un rango de fechas, cuando consulto el resumen, deberia llamar al GET con esos query params y devolver el resumen', () => {
    const resumenEsperado = ResumenBilleteraMother.create();

    const resultado = whenConsultoElResumen(ALUMNO_ID, DESDE, HASTA);

    thenSeHizoGetConRango(ALUMNO_ID, DESDE, HASTA, resumenEsperado);
    expect(resultado()).toEqual(resumenEsperado);
  });

  it('dado un alumno sin rango de fechas, cuando consulto el resumen, no deberia enviar query params de rango', () => {
    whenConsultoElResumen(ALUMNO_ID);

    thenSeHizoGetSinRango(ALUMNO_ID);
  });

  const ResumenBilleteraMother = {
    create(overrides: Partial<BilleteraResumen> = {}): BilleteraResumen {
      return {
        alumnoId: ALUMNO_ID,
        saldoActual: 1250,
        periodo: { desde: DESDE, hasta: HASTA },
        montoIngresado: 3000,
        montoGastado: 1750,
        balancePeriodo: 1250,
        cantidadCompras: 8,
        gastoPorCategoria: [],
        gastoPorClasificacionSalud: [],
        movimientos: [],
        ...overrides,
      };
    },
  };

  function whenConsultoElResumen(
    alumnoId: string,
    desde?: string,
    hasta?: string,
  ): () => BilleteraResumen | undefined {
    let resultado: BilleteraResumen | undefined;
    service.getResumen(alumnoId, desde, hasta).subscribe((r) => (resultado = r));
    return () => resultado;
  }

  function thenSeHizoGetConRango(
    alumnoId: string,
    desde: string,
    hasta: string,
    respuesta: BilleteraResumen,
  ): void {
    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url === `${environment.apiUrl}/wallets/students/${alumnoId}/summary`,
    );
    expect(req.request.params.get('desde')).toBe(desde);
    expect(req.request.params.get('hasta')).toBe(hasta);
    req.flush(respuesta);
  }

  function thenSeHizoGetSinRango(alumnoId: string): void {
    const req = httpMock.expectOne(
      `${environment.apiUrl}/wallets/students/${alumnoId}/summary`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('desde')).toBeFalse();
    expect(req.request.params.has('hasta')).toBeFalse();
    req.flush({});
  }
});
