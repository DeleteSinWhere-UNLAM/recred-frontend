import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BUFFET_ID_TEST, FECHA_TEST, PanelKiosqueroMother } from '../home-kiosquero.mother';
import { HomeKiosqueroService } from './home-kiosquero.service';

describe('HomeKiosqueroService', () => {
  const KIOSQUEROS = `${environment.apiUrl}/kiosqueros`;

  let service: HomeKiosqueroService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HomeKiosqueroService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(HomeKiosqueroService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getPanel', () => {
    it('dado un buffet y una fecha, cuando pido el panel, deberia hacer GET con date en query', async () => {
      const panel = PanelKiosqueroMother.crear();

      const promesa = firstValueFrom(service.getPanel(BUFFET_ID_TEST, FECHA_TEST));
      const req = thenSeHaceUnGetA(`${KIOSQUEROS}/${BUFFET_ID_TEST}/dashboard?date=${FECHA_TEST}`);
      req.flush(panel);

      expect(await promesa).toEqual(panel);
    });

    it('dado view home, cuando pido el panel, deberia mandar view=home junto con la fecha', async () => {
      const panel = PanelKiosqueroMother.crear();

      const promesa = firstValueFrom(service.getPanel(BUFFET_ID_TEST, FECHA_TEST, 'home'));
      const req = thenSeHaceUnGetA(`${KIOSQUEROS}/${BUFFET_ID_TEST}/dashboard?date=${FECHA_TEST}&view=home`);
      req.flush(panel);

      expect(await promesa).toEqual(panel);
    });

    it('dado un buffet sin fecha, cuando pido el panel, deberia no agregar el query param', async () => {
      const promesa = firstValueFrom(service.getPanel(BUFFET_ID_TEST));

      const req = httpMock.expectOne(
        (r) => r.method === 'GET' && r.url === `${KIOSQUEROS}/${BUFFET_ID_TEST}/dashboard`,
      );
      expect(req.request.params.has('date')).toBeFalse();
      expect(req.request.params.has('view')).toBeFalse();
      req.flush(PanelKiosqueroMother.crear());
      await promesa;
    });
  });

  describe('getPanelByRange', () => {
    it('dado un rango from/to, cuando pido el panel, deberia mandar ambos como query params', async () => {
      const promesa = firstValueFrom(
        service.getPanelByRange(BUFFET_ID_TEST, { from: '2026-06-08', to: '2026-06-14' }),
      );

      const req = thenSeHaceUnGetA(
        `${KIOSQUEROS}/${BUFFET_ID_TEST}/dashboard?from=2026-06-08&to=2026-06-14`,
      );
      req.flush(PanelKiosqueroMother.crear());
      await promesa;
    });
  });

  describe('mocks locales', () => {
    it('dado que llamo getResumen, deberia devolver los valores hardcodeados del mock', () => {
      const resumen = service.getResumen();

      expect(resumen.gananciasHoy).toBe(12450);
      expect(resumen.ventasHoy).toBe(34);
      expect(resumen.productosSinStock).toBe(5);
      expect(resumen.pedidosPendientes).toBe(8);
    });

    it('dado que llamo getNombreKiosquero, deberia devolver el nombre mockeado', () => {
      expect(service.getNombreKiosquero()).toBe('Carlos');
    });
  });

  function thenSeHaceUnGetA(url: string) {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    return req;
  }
});
