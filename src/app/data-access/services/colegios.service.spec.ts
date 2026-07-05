import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Colegio } from '../models/colegio.model';
import { Grado } from '../models/grado.model';
import { ColegiosService } from './colegios.service';

describe('ColegiosService', () => {
  const URL_COLEGIOS = `${environment.apiUrl}/colegios`;
  const URL_GRADOS = (colegioId: string): string => `${environment.apiUrl}/colegios/${colegioId}/grados`;

  let service: ColegiosService;
  let httpMock: HttpTestingController;

  class ColegioMother {
    static crear(override: Partial<Colegio> = {}): Colegio {
      return { id: 'colegio-1', nombre: 'Colegio Test', ...override } as Colegio;
    }
  }

  class GradoMother {
    static crear(override: Partial<Grado> = {}): Grado {
      return { id: 'g1', nombre: '1er Año A', ...override } as Grado;
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ColegiosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ColegiosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getColegios', () => {
    it('dado el estado inicial, cuando pido los colegios, deberia devolver los mockeados por defecto', () => {
      const colegios = service.getColegios();

      expect(colegios.length).toBe(2);
      expect(colegios.map((c) => c.id)).toContain('instituto-san-jose');
    });
  });

  describe('obtenerColegios', () => {
    it('dado la primera llamada exitosa, cuando pido colegios, deberia setearlos y no volver a llamar la segunda vez', async () => {
      const backend: Colegio[] = [ColegioMother.crear({ id: 'nuevo-cole', nombre: 'Nuevo Colegio' })];

      const primera = await whenObtengoColegiosYElBackDevuelve(backend);

      expect(primera).toEqual(backend);
      expect(service.getColegios()).toEqual(backend);

      const segunda = await service.obtenerColegios();
      httpMock.expectNone(URL_COLEGIOS);
      expect(segunda).toEqual(backend);
    });

    it('dado que el back devuelve lista vacia, cuando pido colegios, no deberia marcarlos como cargados', async () => {
      const result = await whenObtengoColegiosYElBackDevuelve([]);

      expect(result).toEqual([]);

      const segunda = service.obtenerColegios();
      httpMock.expectOne(URL_COLEGIOS).flush([]);
      await segunda;
    });

    it('dado que el back falla, cuando pido colegios, deberia loguear el error y devolver los cacheados', async () => {
      spyOn(console, 'error');

      const promesa = service.obtenerColegios();
      httpMock.expectOne(URL_COLEGIOS).flush('boom', { status: 500, statusText: 'Server Error' });
      const result = await promesa;

      expect(result.length).toBe(2);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerGradosPorColegio', () => {
    it('dado un colegioId, cuando pido los grados, deberia hacer GET a /colegios/{id}/grados', async () => {
      const grados: Grado[] = [GradoMother.crear()];

      const promesa = service.obtenerGradosPorColegio('cole-1');
      const req = httpMock.expectOne(URL_GRADOS('cole-1'));
      expect(req.request.method).toBe('GET');
      req.flush(grados);

      expect(await promesa).toEqual(grados);
    });
  });

  async function whenObtengoColegiosYElBackDevuelve(backend: Colegio[]): Promise<Colegio[]> {
    const promesa = service.obtenerColegios();
    httpMock.expectOne(URL_COLEGIOS).flush(backend);
    return promesa;
  }
});
