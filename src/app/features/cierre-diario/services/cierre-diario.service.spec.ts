import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BUFFET_ID_TEST,
  EstadoCierreDiarioMother,
  FECHA_TEST,
  RegistroCierreDiarioMother,
  ReporteDiarioMother,
  ResultadoCierreDiarioMother,
} from '../cierre-diario.mother';
import { CierreDiarioService } from './cierre-diario.service';

describe('CierreDiarioService', () => {
  const KIOSQUEROS = `${environment.apiUrl}/kiosqueros`;
  const INVENTORY = `${environment.apiUrl}/inventory`;

  let service: CierreDiarioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CierreDiarioService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CierreDiarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('closeDaily', () => {
    it('dado un buffet y una fecha, cuando cierro el dia, deberia hacer POST sin body y con date en query', async () => {
      const resultado = ResultadoCierreDiarioMother.crear();
      const promesa = firstValueFrom(service.closeDaily(BUFFET_ID_TEST, FECHA_TEST));

      const req = thenSeHaceUnPostA(`${KIOSQUEROS}/${BUFFET_ID_TEST}/daily-close?date=${FECHA_TEST}`);
      expect(req.request.body).toBeNull();
      req.flush(resultado);

      expect(await promesa).toEqual(resultado);
    });
  });

  describe('getReporteDiario', () => {
    it('dado un buffet y una fecha, cuando pido el reporte, deberia hacer GET con date en query', async () => {
      const reporte = ReporteDiarioMother.crear();
      const promesa = firstValueFrom(service.getReporteDiario(BUFFET_ID_TEST, FECHA_TEST));

      const req = thenSeHaceUnGetA(`${KIOSQUEROS}/${BUFFET_ID_TEST}/reports/daily?date=${FECHA_TEST}`);
      req.flush(reporte);

      expect(await promesa).toEqual(reporte);
    });
  });

  describe('getEstadoCierreDiario', () => {
    it('dado un buffet y una fecha, cuando pido el estado, deberia hacer GET al endpoint de status', async () => {
      const estado = EstadoCierreDiarioMother.crearCerrado();
      const promesa = firstValueFrom(service.getEstadoCierreDiario(BUFFET_ID_TEST, FECHA_TEST));

      const req = thenSeHaceUnGetA(`${KIOSQUEROS}/${BUFFET_ID_TEST}/daily-close/status?date=${FECHA_TEST}`);
      req.flush(estado);

      expect((await promesa).closed).toBeTrue();
    });

    it('dado que no paso fecha, cuando pido el estado, no deberia agregar el query param', async () => {
      const promesa = firstValueFrom(service.getEstadoCierreDiario(BUFFET_ID_TEST));

      const req = httpMock.expectOne(
        (r) => r.method === 'GET' && r.url === `${KIOSQUEROS}/${BUFFET_ID_TEST}/daily-close/status`,
      );
      expect(req.request.params.keys().length).toBe(0);
      req.flush(EstadoCierreDiarioMother.crear());
      await promesa;
    });
  });

  describe('getDailyCloses', () => {
    it('dado filtros from y to, cuando pido los cierres, deberia mandar ambos como query params', async () => {
      const promesa = firstValueFrom(
        service.getDailyCloses(BUFFET_ID_TEST, { from: '2026-06-01', to: '2026-06-30' }),
      );

      const req = thenSeHaceUnGetA(
        `${KIOSQUEROS}/${BUFFET_ID_TEST}/daily-closes?from=2026-06-01&to=2026-06-30`,
      );
      req.flush([RegistroCierreDiarioMother.crear()]);

      expect((await promesa).length).toBe(1);
    });

    it('dado sin filtros, cuando pido los cierres, no deberia agregar params', async () => {
      const promesa = firstValueFrom(service.getDailyCloses(BUFFET_ID_TEST));

      const req = httpMock.expectOne(
        (r) => r.method === 'GET' && r.url === `${KIOSQUEROS}/${BUFFET_ID_TEST}/daily-closes`,
      );
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
      await promesa;
    });
  });

  describe('refreshAfterClose', () => {
    it('dado un cierre, cuando refresco, deberia pegarle a inventario/ordenes/alertas/reporte en paralelo y devolver el reporte', async () => {
      const reporte = ReporteDiarioMother.crear();
      const promesa = firstValueFrom(service.refreshAfterClose(BUFFET_ID_TEST, FECHA_TEST));

      httpMock.expectOne(`${INVENTORY}/${BUFFET_ID_TEST}/overview`).flush([]);
      httpMock.expectOne(`${KIOSQUEROS}/${BUFFET_ID_TEST}/orders`).flush([]);
      httpMock.expectOne(`${KIOSQUEROS}/${BUFFET_ID_TEST}/alerts`).flush([]);
      httpMock
        .expectOne(`${KIOSQUEROS}/${BUFFET_ID_TEST}/reports/daily?date=${FECHA_TEST}`)
        .flush(reporte);

      expect(await promesa).toEqual(reporte);
    });

    it('dado que inventario/orders/alertas fallan pero el reporte sale, deberia devolver el reporte igual', async () => {
      const reporte = ReporteDiarioMother.crear();
      const promesa = firstValueFrom(service.refreshAfterClose(BUFFET_ID_TEST, FECHA_TEST));

      httpMock
        .expectOne(`${INVENTORY}/${BUFFET_ID_TEST}/overview`)
        .error(new ProgressEvent('boom'));
      httpMock
        .expectOne(`${KIOSQUEROS}/${BUFFET_ID_TEST}/orders`)
        .error(new ProgressEvent('boom'));
      httpMock
        .expectOne(`${KIOSQUEROS}/${BUFFET_ID_TEST}/alerts`)
        .error(new ProgressEvent('boom'));
      httpMock
        .expectOne(`${KIOSQUEROS}/${BUFFET_ID_TEST}/reports/daily?date=${FECHA_TEST}`)
        .flush(reporte);

      expect(await promesa).toEqual(reporte);
    });
  });

  describe('CSV del reporte', () => {
    it('dado un buffet y una fecha, la URL directa deberia estar encodeada', () => {
      const url = service.getReporteDiarioCsvUrl(BUFFET_ID_TEST, FECHA_TEST);

      expect(url).toBe(`${KIOSQUEROS}/${BUFFET_ID_TEST}/reports/daily.csv?date=${FECHA_TEST}`);
    });

    it('dado un buffet y una fecha, cuando descargo el CSV autenticado, deberia pedirlo como blob', async () => {
      const csv = new Blob(['metric,value'], { type: 'text/csv' });
      const promesa = firstValueFrom(
        service.downloadReporteDiarioCsv(BUFFET_ID_TEST, FECHA_TEST),
      );

      const req = thenSeHaceUnGetA(
        `${KIOSQUEROS}/${BUFFET_ID_TEST}/reports/daily.csv?date=${FECHA_TEST}`,
      );
      expect(req.request.responseType).toBe('blob');
      req.flush(csv);

      expect(await promesa).toBe(csv);
    });
  });

  function thenSeHaceUnGetA(url: string) {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHaceUnPostA(url: string) {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    return req;
  }
});
