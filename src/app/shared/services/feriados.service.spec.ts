import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeriadosService, Feriado } from './feriados.service';

describe('FeriadosService', () => {
  let service: FeriadosService;
  let httpMock: HttpTestingController;

  const mockFeriados: Feriado[] = [
    { dia: 1, mes: 1, motivo: 'Año Nuevo', tipo: 'inamovible', info: '', id: '1' },
    { dia: 25, mes: 5, motivo: 'Revolución de Mayo', tipo: 'inamovible', info: '', id: '2' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeriadosService,
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    });

    service = TestBed.inject(FeriadosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('dado que consulto feriados por primera vez, deberia llamar a la API y cachear', () => {
    const anio = 2026;
    service.obtenerFeriados(anio).subscribe((feriados) => {
      expect(feriados).toEqual(mockFeriados);
    });

    const req = httpMock.expectOne(`https://nolaborables.com.ar/api/v2/feriados/${anio}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockFeriados);

    service.obtenerFeriados(anio).subscribe((feriados) => {
      expect(feriados).toEqual(mockFeriados);
    });

    httpMock.expectNone(`https://nolaborables.com.ar/api/v2/feriados/${anio}`);
  });

  it('dado que falla la peticion HTTP, deberia devolver un array vacio', () => {
    const anio = 2025;
    service.obtenerFeriados(anio).subscribe((feriados) => {
      expect(feriados).toEqual([]);
    });

    const req = httpMock.expectOne(`https://nolaborables.com.ar/api/v2/feriados/${anio}`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  it('dado que consulto si es feriado hoy y lo es, deberia devolver esFeriado true', () => {
    jasmine.clock().install();
    const mockDate = new Date(2026, 4, 25); 
    jasmine.clock().mockDate(mockDate);

    service.esFeriadoHoy().subscribe((res) => {
      expect(res.esFeriado).toBeTrue();
      expect(res.motivo).toBe('Revolución de Mayo');
    });

    const req = httpMock.expectOne(`https://nolaborables.com.ar/api/v2/feriados/2026`);
    req.flush(mockFeriados);

    jasmine.clock().uninstall();
  });

  it('dado que consulto si es feriado hoy y no lo es, deberia devolver esFeriado false', () => {
    jasmine.clock().install();
    const mockDate = new Date(2026, 4, 26); 
    jasmine.clock().mockDate(mockDate);

    service.esFeriadoHoy().subscribe((res) => {
      expect(res.esFeriado).toBeFalse();
    });

    const req = httpMock.expectOne(`https://nolaborables.com.ar/api/v2/feriados/2026`);
    req.flush(mockFeriados);

    jasmine.clock().uninstall();
  });
});
