import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PayoutConfigService } from './payout-config.service';
import { environment } from '../../../../environments/environment';
import { provideHttpClient } from '@angular/common/http';
import { PayoutConfig } from '../../../data-access/models/payout-config.model';

describe('PayoutConfigService', () => {
  let service: PayoutConfigService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PayoutConfigService],
    });

    service = TestBed.inject(PayoutConfigService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  const givenConfiguracionMock = (idKiosquero: string, mockConfig: PayoutConfig) => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/${idKiosquero}/payout-config`);
    expect(req.request.method).toEqual('GET');
    req.flush(mockConfig);
  };

  const givenGuardarConfiguracionMock = (idKiosquero: string, mockConfig: PayoutConfig) => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/kiosqueros/${idKiosquero}/payout-config`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(mockConfig);
    req.flush(mockConfig);
  };

  it('debería consultar la configuración de pagos del kiosquero y devolverla', async () => {

    const kiosqueroId = 'kiosquero-123';
    const mockConfig: PayoutConfig = {
      destinationCvu: '0000003100012345678901',
      destinationCuit: '20304050607',
      accountHolderName: 'Juan Perez',
      cantidadIntervalo: 1,
      unidadIntervalo: 'DAYS',
      estado: 'ACTIVE',
      proximaEjecucion: '2026-07-12',
      ultimaEjecucion: '2026-07-05',
    };


    const promise = service.obtenerConfiguracion(kiosqueroId);
    givenConfiguracionMock(kiosqueroId, mockConfig);
    const resultado = await promise;

    expect(resultado).toEqual(mockConfig);
    expect(resultado.destinationCuit).toEqual('20304050607');
  });

  it('debería enviar la configuración al backend para guardarla y devolver la respuesta', async () => {
    const kiosqueroId = 'kiosquero-123';
    const nuevaConfig: PayoutConfig = {
      destinationCvu: '0000003100012345678901',
      destinationCuit: '20304050607',
      accountHolderName: 'Juan Perez',
      cantidadIntervalo: 10,
      unidadIntervalo: 'DAYS',
      estado: 'ACTIVE',
    };

    const promise = service.guardarConfiguracion(kiosqueroId, nuevaConfig);
    givenGuardarConfiguracionMock(kiosqueroId, nuevaConfig);
    const resultado = await promise;

    expect(resultado).toEqual(nuevaConfig);
    expect(resultado.cantidadIntervalo).toEqual(10);
  });
});
