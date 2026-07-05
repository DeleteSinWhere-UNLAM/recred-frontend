import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SugerenciaAgregarProducto } from '../models/sugerencia-agregar.model';
import { SugerenciaAgregarProductoMother } from '../sugerencias-agregar.mother';
import { SugerenciasAgregarService } from './sugerencias-agregar.service';

describe('SugerenciasAgregarService', () => {
  const URL_SUGERENCIAS = `${environment.apiUrl}/sugerencias/agregar-producto`;

  let service: SugerenciasAgregarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SugerenciasAgregarService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SugerenciasAgregarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getSugerenciasAgregarProducto', () => {
    it('cuando pido las oportunidades de stock, deberia hacer GET a /sugerencias/agregar-producto', async () => {
      const sugerencias = SugerenciaAgregarProductoMother.crearVarias();

      const promesa = whenPidoLasOportunidades();

      thenSeHizoGetSugerenciasAgregar().flush(sugerencias);

      expect(await promesa).toEqual(sugerencias);
    });

    it('dado que el back devuelve error, cuando pido las oportunidades, deberia rechazar la promesa', async () => {
      const promesa = whenPidoLasOportunidades();

      thenSeHizoGetSugerenciasAgregar().flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  function whenPidoLasOportunidades(): Promise<SugerenciaAgregarProducto[]> {
    return firstValueFrom(service.getSugerenciasAgregarProducto());
  }

  function thenSeHizoGetSugerenciasAgregar(): TestRequest {
    const req = httpMock.expectOne(URL_SUGERENCIAS);
    expect(req.request.method).toBe('GET');
    return req;
  }
});
