import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Colegio } from '../models/colegio.model';
import { Grado } from '../models/grado.model';
import { ColegiosService } from './colegios.service';

describe('ColegiosService', () => {
  let service: ColegiosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ColegiosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ColegiosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getColegios', () => {
    it('dado el estado inicial, deberia devolver los colegios mockeados por defecto', () => {
      const colegios = service.getColegios();

      expect(colegios.length).toBe(2);
      expect(colegios.map((c) => c.id)).toContain('instituto-san-jose');
    });
  });

  describe('obtenerColegios', () => {
    it('dado la primera llamada exitosa, deberia setear los colegios y no volver a llamar la segunda vez', async () => {
      const backend: Colegio[] = [{ id: 'nuevo-cole', nombre: 'Nuevo Colegio' }];

      const promesa = service.obtenerColegios();
      httpMock.expectOne(`${environment.apiUrl}/colegios`).flush(backend);
      const primera = await promesa;

      expect(primera).toEqual(backend);
      expect(service.getColegios()).toEqual(backend);

      const segunda = await service.obtenerColegios();
      httpMock.expectNone(`${environment.apiUrl}/colegios`);
      expect(segunda).toEqual(backend);
    });

    it('dado que el back devuelve lista vacia, no deberia marcar como cargado y deberia devolverla igual', async () => {
      const promesa = service.obtenerColegios();
      httpMock.expectOne(`${environment.apiUrl}/colegios`).flush([]);
      const result = await promesa;

      expect(result).toEqual([]);

      const segunda = service.obtenerColegios();
      httpMock.expectOne(`${environment.apiUrl}/colegios`).flush([]);
      await segunda;
    });

    it('dado que el back falla, deberia loguear el error y devolver los colegios cacheados', async () => {
      spyOn(console, 'error');

      const promesa = service.obtenerColegios();
      httpMock.expectOne(`${environment.apiUrl}/colegios`).flush('boom', {
        status: 500,
        statusText: 'Server Error',
      });
      const result = await promesa;

      expect(result.length).toBe(2);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerGradosPorColegio', () => {
    it('dado un colegioId, deberia hacer GET a /colegios/{id}/grados', async () => {
      const grados: Grado[] = [{ id: 'g1', nombre: '1er Año A' } as Grado];

      const promesa = service.obtenerGradosPorColegio('cole-1');
      const req = httpMock.expectOne(`${environment.apiUrl}/colegios/cole-1/grados`);
      expect(req.request.method).toBe('GET');
      req.flush(grados);

      expect(await promesa).toEqual(grados);
    });
  });
});
