import { TestBed } from '@angular/core/testing';
import { DirectivoService } from './directivo.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

describe('DirectivoService', () => {
  let service: DirectivoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DirectivoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DirectivoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado el TestBed configurado, cuando inyecto el service, deberia crearse correctamente', () => {
    whenInyectoElService();

    thenElServiceExiste();
  });

  it('debería hacer un GET a /colegios/me y devolver los datos', async () => {
    const mockData = { id: '1', nombre: 'Test', cue: '123', buffets: [] };
    const promise = service.obtenerResumenColegio();

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    const result = await promise;
    expect(result).toEqual(mockData);
  });

  it('debería hacer un POST a /colegios/:schoolId/buffets', async () => {
    const mockData = { buffetId: 'b1' };
    const payload = { name: 'K1', habilitationExpirationDate: '2027-12-31' };
    const promise = service.crearBuffet('s1', payload);

    const req = httpMock.expectOne(`${environment.apiUrl}/colegios/s1/buffets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockData);

    const result = await promise;
    expect(result).toEqual(mockData);
  });

  it('debería hacer un POST a /buffets/:buffetId/sellers', async () => {
    const mockData = { kiosqueroId: 'k1', usuarioId: 'u1' };
    const payload = { username: 'a', email: 'a@a.com', firstName: 'a', lastName: 'a', dni: '1', phone: '1', cuit: '1' };
    const promise = service.registrarVendedor('b1', payload);

    const req = httpMock.expectOne(`${environment.apiUrl}/buffets/b1/sellers`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockData);

    const result = await promise;
    expect(result).toEqual(mockData);
  });

  function whenInyectoElService(): DirectivoService {
    return service;
  }

  function thenElServiceExiste(): void {
    expect(service).toBeTruthy();
  }
});
