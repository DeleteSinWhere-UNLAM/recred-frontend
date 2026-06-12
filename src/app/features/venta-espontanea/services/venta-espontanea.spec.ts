import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { VentaEspontaneaService } from './venta-espontanea';
import { BuffetService } from '../../buffet/services/buffet.service';

describe('VentaEspontaneaService', () => {
  let service: VentaEspontaneaService;
  let buffetServiceMock: jasmine.SpyObj<BuffetService>;

  beforeEach(() => {
    buffetServiceMock = jasmine.createSpyObj('BuffetService', ['getProductosDelBuffet']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BuffetService, useValue: buffetServiceMock }
      ]
    });
    service = TestBed.inject(VentaEspontaneaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
