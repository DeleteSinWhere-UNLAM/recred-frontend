import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CarritosFavoritosService } from './carritos-favoritos.service';
import { environment } from '../../../../environments/environment';
import { CarritoFavoritoResponse, SaveCarritoFavoritoRequest } from '../models/carritos-favoritos.model';

describe('CarritosFavoritosService', () => {
  let service: CarritosFavoritosService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CarritosFavoritosService]
    });
    service = TestBed.inject(CarritosFavoritosService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getCarritosFavoritos', () => {
    it('dado que no hay parametros, debe llamar a GET', () => {
      const mockResponse: CarritoFavoritoResponse[] = [];

      service.getCarritosFavoritos().subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/carritos-favoritos`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('dado que se provee el parametro alumnoId, debe llamar a GET', () => {
      service.getCarritosFavoritos('123').subscribe();

      const req = httpTestingController.expectOne(request => 
        request.url === `${environment.apiUrl}/carritos-favoritos` && request.params.get('alumnoId') === '123'
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('dado que se provee el parametro productoId, debe llamar a GET', () => {
      service.getCarritosFavoritos(undefined, 'prod1').subscribe();

      const req = httpTestingController.expectOne(request => 
        request.url === `${environment.apiUrl}/carritos-favoritos` && request.params.get('productoId') === 'prod1'
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('dado que se proveen ambos parametros, debe llamar a GET', () => {
      service.getCarritosFavoritos('123', 'prod1').subscribe();

      const req = httpTestingController.expectOne(request => 
        request.url === `${environment.apiUrl}/carritos-favoritos` && 
        request.params.get('alumnoId') === '123' &&
        request.params.get('productoId') === 'prod1'
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('saveCarritoFavorito', () => {
    it('dado que se guarda, debe llamar a POST', () => {
      const mockRequest: SaveCarritoFavoritoRequest = { nombre: 'Test' } as any;
      const mockResponse: CarritoFavoritoResponse = { id: '1', nombre: 'Test' } as any;

      service.saveCarritoFavorito(mockRequest).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/carritos-favoritos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });

  describe('deleteCarritoFavorito', () => {
    it('dado que se elimina, debe llamar a DELETE', () => {
      service.deleteCarritoFavorito('123').subscribe();

      const req = httpTestingController.expectOne(`${environment.apiUrl}/carritos-favoritos/123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
