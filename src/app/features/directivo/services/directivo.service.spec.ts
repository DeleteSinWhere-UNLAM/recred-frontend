import { TestBed } from '@angular/core/testing';
import { DirectivoService } from './directivo.service';

describe('DirectivoService', () => {
  let service: DirectivoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectivoService);
  });

  it('dado el TestBed configurado, cuando inyecto el service, deberia crearse correctamente', () => {
    whenInyectoElService();

    thenElServiceExiste();
  });

  function whenInyectoElService(): DirectivoService {
    return service;
  }

  function thenElServiceExiste(): void {
    expect(service).toBeTruthy();
  }
});
