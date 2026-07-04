import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Feriado, FeriadosService } from './feriados.service';

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
      const promesa = firstValueFrom(service.obtenerFeriados(2026));

      const req = httpMock.expectOne('https://nolaborables.com.ar/api/v2/feriados/2026');
      expect(req.request.method).toBe('GET');
      req.flush(feriados);

      expect(await promesa).toEqual(feriados);
    });

    it('dado un anio ya cacheado, cuando pido de nuevo, no deberia hacer HTTP', async () => {
      const feriados = [FeriadoMother.crear()];
      const primera = firstValueFrom(service.obtenerFeriados(2026));
      httpMock.expectOne('https://nolaborables.com.ar/api/v2/feriados/2026').flush(feriados);
      await primera;

      const segunda = await firstValueFrom(service.obtenerFeriados(2026));

      expect(segunda).toEqual(feriados);
      httpMock.expectNone('https://nolaborables.com.ar/api/v2/feriados/2026');
    });

    it('dado sin anio explicito, deberia usar el anio actual', async () => {
      const anioActual = new Date().getFullYear();
      const promesa = firstValueFrom(service.obtenerFeriados());

      const req = httpMock.expectOne(
        `https://nolaborables.com.ar/api/v2/feriados/${anioActual}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
      await promesa;
    });

    it('dado que la api falla, deberia devolver lista vacia y no romper', async () => {
      spyOn(console, 'error');
      const promesa = firstValueFrom(service.obtenerFeriados(2026));

      httpMock
        .expectOne('https://nolaborables.com.ar/api/v2/feriados/2026')
        .error(new ProgressEvent('boom'));

      expect(await promesa).toEqual([]);
    });
  });

  describe('esFeriadoHoy', () => {
    it('dado que hoy es feriado, deberia devolver esFeriado true con el motivo', async () => {
      const hoy = new Date();
      const feriado = FeriadoMother.crear({
        dia: hoy.getDate(),
        mes: hoy.getMonth() + 1,
        motivo: 'Feriado nacional',
      });
      const promesa = firstValueFrom(service.esFeriadoHoy());

      httpMock
        .expectOne(`https://nolaborables.com.ar/api/v2/feriados/${hoy.getFullYear()}`)
        .flush([feriado]);

      const resultado = await promesa;
      expect(resultado.esFeriado).toBeTrue();
      expect(resultado.motivo).toBe('Feriado nacional');
    });

    it('dado que hoy no es feriado, deberia devolver esFeriado false sin motivo', async () => {
      const hoy = new Date();
      const otroDia = FeriadoMother.crear({
        dia: (hoy.getDate() % 28) + 1,
        mes: hoy.getMonth() + 1,
      });
      const promesa = firstValueFrom(service.esFeriadoHoy());

      httpMock
        .expectOne(`https://nolaborables.com.ar/api/v2/feriados/${hoy.getFullYear()}`)
        .flush([otroDia]);

      const resultado = await promesa;
      expect(resultado.esFeriado).toBeFalse();
      expect(resultado.motivo).toBeUndefined();
    });
  });
});
