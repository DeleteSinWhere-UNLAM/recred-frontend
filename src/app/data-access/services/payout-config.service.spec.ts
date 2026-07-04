import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PayoutConfig } from '../models/payout-config.model';
import { PayoutConfigService } from './payout-config.service';

describe('PayoutConfigService', () => {
  let service: PayoutConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PayoutConfigService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PayoutConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obtenerConfiguracion hace GET a /kiosqueros/{id}/payout-config', async () => {
    const config = { cbu: '123' } as unknown as PayoutConfig;

    const promesa = service.obtenerConfiguracion('kiosco-1');
    const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/kiosco-1/payout-config`);

    expect(req.request.method).toBe('GET');
    req.flush(config);

    expect(await promesa).toEqual(config);
  });

  it('guardarConfiguracion hace POST con el body a /kiosqueros/{id}/payout-config', async () => {
    const config = { cbu: '456' } as unknown as PayoutConfig;

    const promesa = service.guardarConfiguracion('kiosco-2', config);
    const req = httpMock.expectOne(`${environment.apiUrl}/kiosqueros/kiosco-2/payout-config`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(config);
    req.flush(config);

    expect(await promesa).toEqual(config);
  });
});
