import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PayoutConfigService } from './payout-config.service';
import { environment } from '../../../../environments/environment';
import { provideHttpClient } from '@angular/common/http';
import { PayoutConfig } from '../../../data-access/models/payout-config.model';

describe('PayoutConfigService', () => {
  const URL_PAYOUT_CONFIG = (kiosqueroId: string): string =>
    `${environment.apiUrl}/kiosqueros/${kiosqueroId}/payout-config`;

  let service: PayoutConfigService;
  let httpTestingController: HttpTestingController;

  class PayoutConfigMother {
    static crear(override: Partial<PayoutConfig> = {}): PayoutConfig {
      return {
        destinationCvu: '0000003100012345678901',
        destinationCuit: '20304050607',
        accountHolderName: 'Juan Perez',
        cantidadIntervalo: 1,
        unidadIntervalo: 'DAYS',
        estado: 'ACTIVE',
        proximaEjecucion: '2026-07-12',
        ultimaEjecucion: '2026-07-05',
        ...override,
      };
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PayoutConfigService],
    });

    service = TestBed.inject(PayoutConfigService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('dado un kiosqueroId, cuando pido la configuracion, deberia hacer GET a /kiosqueros/{id}/payout-config y devolverla', async () => {
    const kiosqueroId = 'kiosquero-123';
    const mockConfig = PayoutConfigMother.crear();

    const promise = service.obtenerConfiguracion(kiosqueroId);
    thenElBackDevuelveConfiguracion(kiosqueroId, mockConfig);
    const resultado = await promise;

    expect(resultado).toEqual(mockConfig);
    expect(resultado.destinationCuit).toEqual('20304050607');
  });

  it('dado una configuracion nueva, cuando guardo, deberia hacer POST a /kiosqueros/{id}/payout-config y devolver la respuesta', async () => {
    const kiosqueroId = 'kiosquero-123';
    const nuevaConfig = PayoutConfigMother.crear({
      cantidadIntervalo: 10,
      proximaEjecucion: undefined,
      ultimaEjecucion: undefined,
    });

    const promise = service.guardarConfiguracion(kiosqueroId, nuevaConfig);
    thenElBackAceptaGuardar(kiosqueroId, nuevaConfig);
    const resultado = await promise;

    expect(resultado).toEqual(nuevaConfig);
    expect(resultado.cantidadIntervalo).toEqual(10);
  });

  function thenElBackDevuelveConfiguracion(kiosqueroId: string, config: PayoutConfig): void {
    const req = httpTestingController.expectOne(URL_PAYOUT_CONFIG(kiosqueroId));
    expect(req.request.method).toEqual('GET');
    req.flush(config);
  }

  function thenElBackAceptaGuardar(kiosqueroId: string, config: PayoutConfig): void {
    const req = httpTestingController.expectOne(URL_PAYOUT_CONFIG(kiosqueroId));
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(config);
    req.flush(config);
  }
});
