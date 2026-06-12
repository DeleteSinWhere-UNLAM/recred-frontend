import { TestBed } from '@angular/core/testing';

import { VentaEspontanea } from './venta-espontanea';

describe('VentaEspontanea', () => {
  let service: VentaEspontanea;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VentaEspontanea);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
