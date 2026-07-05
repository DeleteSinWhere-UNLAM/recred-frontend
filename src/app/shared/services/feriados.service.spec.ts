import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Feriado, FeriadosService } from './feriados.service';

interface EsFeriadoHoyResponse {
  esFeriado: boolean;
  motivo?: string;
}

class FeriadoMother {
  static crear(override: Partial<Feriado> = {}): Feriado {
    return {
      motivo: 'Día de la Independencia',
      tipo: 'inamovible',
      info: '',
      dia: 9,
      mes: 7,
      id: 'independencia',
      ...override,
    };
  }
}

describe('FeriadosService', () => {
  const URL_FERIADOS = (anio: number): string => `https://nolaborables.com.ar/api/v2/feriados/${anio}`;

  let service: FeriadosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeriadosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FeriadosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('obtenerFeriados', () => {
    it('dado el service sin cache, cuando pido feriados de un anio, deberia hacer GET a la api externa', async () => {
      const feriados = [FeriadoMother.crear()];

      const promesa = whenPidoFeriadosDe(2026);

      thenSeHizoGetFeriadosDe(2026).flush(feriados);

      expect(await promesa).toEqual(feriados);
    });

    it('dado un anio ya cacheado, cuando pido de nuevo, no deberia hacer HTTP', async () => {
      const feriados = [FeriadoMother.crear()];
      const primera = whenPidoFeriadosDe(2026);
      thenSeHizoGetFeriadosDe(2026).flush(feriados);
      await primera;

      const segunda = await whenPidoFeriadosDe(2026);

      expect(segunda).toEqual(feriados);
      httpMock.expectNone(URL_FERIADOS(2026));
    });

    it('dado sin anio explicito, cuando pido feriados, deberia usar el anio actual', async () => {
      const anioActual = new Date().getFullYear();

      const promesa = whenPidoFeriadosDelAnioActual();

      thenSeHizoGetFeriadosDe(anioActual).flush([]);

      await promesa;
    });

    it('dado que la api falla, cuando pido feriados, deberia devolver lista vacia y no romper', async () => {
      spyOn(console, 'error');
      const promesa = whenPidoFeriadosDe(2026);

      thenSeHizoGetFeriadosDe(2026).error(new ProgressEvent('boom'));

      expect(await promesa).toEqual([]);
    });
  });

  describe('esFeriadoHoy', () => {
    it('dado que hoy es feriado, cuando consulto, deberia devolver esFeriado true con el motivo', async () => {
      const hoy = new Date();
      const feriado = FeriadoMother.crear({
        dia: hoy.getDate(),
        mes: hoy.getMonth() + 1,
        motivo: 'Feriado nacional',
      });

      const promesa = whenConsultoEsFeriadoHoy();

      thenSeHizoGetFeriadosDe(hoy.getFullYear()).flush([feriado]);

      const resultado = await promesa;
      expect(resultado.esFeriado).toBeTrue();
      expect(resultado.motivo).toBe('Feriado nacional');
    });

    it('dado que hoy no es feriado, cuando consulto, deberia devolver esFeriado false sin motivo', async () => {
      const hoy = new Date();
      const otroDia = FeriadoMother.crear({
        dia: (hoy.getDate() % 28) + 1,
        mes: hoy.getMonth() + 1,
      });

      const promesa = whenConsultoEsFeriadoHoy();

      thenSeHizoGetFeriadosDe(hoy.getFullYear()).flush([otroDia]);

      const resultado = await promesa;
      expect(resultado.esFeriado).toBeFalse();
      expect(resultado.motivo).toBeUndefined();
    });
  });

  function whenPidoFeriadosDe(anio: number): Promise<Feriado[]> {
    return firstValueFrom(service.obtenerFeriados(anio));
  }

  function whenPidoFeriadosDelAnioActual(): Promise<Feriado[]> {
    return firstValueFrom(service.obtenerFeriados());
  }

  function whenConsultoEsFeriadoHoy(): Promise<EsFeriadoHoyResponse> {
    return firstValueFrom(service.esFeriadoHoy());
  }

  function thenSeHizoGetFeriadosDe(anio: number): TestRequest {
    const req = httpMock.expectOne(URL_FERIADOS(anio));
    expect(req.request.method).toBe('GET');
    return req;
  }
});
