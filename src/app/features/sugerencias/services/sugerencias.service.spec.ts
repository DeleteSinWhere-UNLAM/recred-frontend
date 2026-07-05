import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ComboSuggestion, SugerenciaProducto } from '../models/sugerencia-producto.model';
import { ComboSuggestionMother, SugerenciaProductoMother } from '../sugerencias.mother';
import { SugerenciasService } from './sugerencias.service';

describe('SugerenciasService', () => {
  const URL_SUGERENCIAS = `${environment.apiUrl}/kiosqueros/me/lista-sugerencia-cambio-producto`;
  const URL_COMPRAR = `${environment.apiUrl}/sugerencias-consumo/comprar`;
  const URL_COMBO = (productId: string): string => `${environment.apiUrl}/combo-suggestions/${productId}`;

  let service: SugerenciasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SugerenciasService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SugerenciasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getSugerencias', () => {
    it('cuando pido las sugerencias, deberia hacer GET al endpoint del kiosquero', async () => {
      const sugerencias = SugerenciaProductoMother.crearVarias();

      const promesa = whenPidoLasSugerencias();

      thenSeHizoGetSugerencias().flush(sugerencias);

      expect(await promesa).toEqual(sugerencias);
    });

    it('dado que el back devuelve 500, cuando pido las sugerencias, deberia rechazar con status 500', async () => {
      const promesa = whenPidoLasSugerencias();

      thenSeHizoGetSugerencias().flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejectedWith(jasmine.objectContaining({ status: 500 }));
    });
  });

  describe('comprarSugerencia', () => {
    it('dado un sugerenciaId, cuando compro, deberia hacer POST con el id en el body', async () => {
      const promesa = whenCompro('sug-123');

      thenSeHizoPostComprarCon('sug-123').flush(null);

      await expectAsync(promesa).toBeResolved();
    });

    it('dado que el back devuelve 400, cuando compro, deberia rechazar con status 400', async () => {
      const promesa = whenCompro('sug-123');

      thenSeHizoPostComprarCon('sug-123').flush('bad', { status: 400, statusText: 'Bad Request' });

      await expectAsync(promesa).toBeRejectedWith(jasmine.objectContaining({ status: 400 }));
    });
  });

  describe('getComboSuggestions', () => {
    it('dado un productId, cuando pido las sugerencias de combo, deberia hacer GET a /combo-suggestions/{id}', async () => {
      const combo = ComboSuggestionMother.crear();

      const promesa = whenPidoComboSuggestions('prod-123');

      thenSeHizoGetComboDe('prod-123').flush(combo);

      expect(await promesa).toEqual(combo);
    });

    it('dado que el back devuelve 404, cuando pido combos, deberia rechazar con status 404', async () => {
      const promesa = whenPidoComboSuggestions('prod-123');

      thenSeHizoGetComboDe('prod-123').flush('not found', { status: 404, statusText: 'Not Found' });

      await expectAsync(promesa).toBeRejectedWith(jasmine.objectContaining({ status: 404 }));
    });
  });

  function whenPidoLasSugerencias(): Promise<SugerenciaProducto[]> {
    return firstValueFrom(service.getSugerencias());
  }

  function whenCompro(sugerenciaId: string): Promise<void> {
    return firstValueFrom(service.comprarSugerencia(sugerenciaId));
  }

  function whenPidoComboSuggestions(productId: string): Promise<ComboSuggestion> {
    return firstValueFrom(service.getComboSuggestions(productId));
  }

  function thenSeHizoGetSugerencias(): TestRequest {
    const req = httpMock.expectOne(URL_SUGERENCIAS);
    expect(req.request.method).toBe('GET');
    return req;
  }

  function thenSeHizoPostComprarCon(sugerenciaId: string): TestRequest {
    const req = httpMock.expectOne(URL_COMPRAR);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sugerenciaId });
    return req;
  }

  function thenSeHizoGetComboDe(productId: string): TestRequest {
    const req = httpMock.expectOne(URL_COMBO(productId));
    expect(req.request.method).toBe('GET');
    return req;
  }
});
