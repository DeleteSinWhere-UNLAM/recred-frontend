import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ColegiosService } from './colegios.service';
import { environment } from '../../../environments/environment';

describe('ColegiosService', () => {
  let service: ColegiosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ColegiosService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ColegiosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getColegios', () => {
    it('dado que se llama a getColegios, debería retornar la lista hardcodeada de colegios', () => {
      const colegios = service.getColegios();
      expect(colegios.length).toBe(2);
      expect(colegios[0].id).toBe('instituto-san-jose');
    });
  });

  describe('obtenerColegios', () => {
    it('dado que se llama a obtenerColegios, debería hacer un GET a /colegios', (done) => {
      const mockColegios = [{ id: '1', nombre: 'Colegio 1' }];

      service.obtenerColegios().then(colegios => {
        expect(colegios).toEqual(mockColegios);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/colegios`);
      expect(req.request.method).toBe('GET');
      req.flush(mockColegios);
    });
  });

  describe('obtenerGradosPorColegio', () => {
    it('dado que se llama a obtenerGradosPorColegio con un ID, debería hacer un GET a /colegios/:id/grados', (done) => {
      const colegioId = '123';
      const mockGrados = [{ id: 'g1', nombre: 'Grado 1' }];

      service.obtenerGradosPorColegio(colegioId).then(grados => {
        expect(grados).toEqual(mockGrados);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/colegios/${colegioId}/grados`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGrados);
    });
  });
});
