import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CarritoFavoritoResponseMother,
  SaveCarritoFavoritoRequestMother,
} from '../carritos-favoritos.mother';
import { CarritoFavoritoResponse } from '../models/carritos-favoritos.model';
import { CarritosFavoritosService } from './carritos-favoritos.service';

describe('CarritosFavoritosService', () => {
  const URL_CARRITOS = `${environment.apiUrl}/carritos-favoritos`;

  let service: CarritosFavoritosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CarritosFavoritosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getCarritosFavoritos', () => {
    it('dado sin filtros, cuando pido los carritos, deberia hacer GET al base sin query params', async () => {
      const promesa = whenPidoCarritos();

      const req = thenSeHizoGetAlBase();
      expect(req.request.params.keys().length).toBe(0);
      req.flush([CarritoFavoritoResponseMother.crear()]);

      const carritos = await promesa;
      expect(carritos.length).toBe(1);
    });

    it('dado un alumnoId, cuando pido los carritos, deberia agregarlo como query param', async () => {
      const promesa = whenPidoCarritos('alumno-1');

      const req = thenSeHizoGetAlBase();
      expect(req.request.params.get('alumnoId')).toBe('alumno-1');
      req.flush([]);
      await promesa;
    });

    it('dado alumnoId y productoId, cuando pido los carritos, deberia mandar ambos query params', async () => {
      const promesa = whenPidoCarritos('alumno-1', 'prod-1');

      const req = thenSeHizoGetAlBase();
      expect(req.request.params.get('alumnoId')).toBe('alumno-1');
      expect(req.request.params.get('productoId')).toBe('prod-1');
      req.flush([]);
      await promesa;
    });
  });

  describe('saveCarritoFavorito', () => {
    it('dado un request, cuando guardo, deberia hacer POST al base con el body', async () => {
      const request = SaveCarritoFavoritoRequestMother.crear({ nombre: 'Merienda' });
      const promesa = firstValueFrom(service.saveCarritoFavorito(request));

      const req = httpMock.expectOne(URL_CARRITOS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(CarritoFavoritoResponseMother.crear({ nombre: 'Merienda' }));

      const guardado = await promesa;
      expect(guardado.nombre).toBe('Merienda');
    });
  });

  describe('deleteCarritoFavorito', () => {
    it('dado un id, cuando elimino, deberia hacer DELETE /base/{id}', async () => {
      const promesa = firstValueFrom(service.deleteCarritoFavorito('carrito-42'));

      const req = httpMock.expectOne(`${URL_CARRITOS}/carrito-42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promesa;
    });
  });

  function whenPidoCarritos(alumnoId?: string, productoId?: string): Promise<CarritoFavoritoResponse[]> {
    return firstValueFrom(service.getCarritosFavoritos(alumnoId, productoId));
  }

  function thenSeHizoGetAlBase(): ReturnType<HttpTestingController['expectOne']> {
    return httpMock.expectOne(
      (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === URL_CARRITOS,
    );
  }
});
