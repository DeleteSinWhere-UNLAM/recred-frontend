import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { VentaEspontaneaService } from './venta-espontanea';
import { BuffetService } from '../../buffet/services/buffet.service';

describe('VentaEspontaneaService', () => {
  let service: VentaEspontaneaService;
  let buffetServiceMock: jasmine.SpyObj<BuffetService>;

  beforeEach(() => {
    buffetServiceMock = jasmine.createSpyObj('BuffetService', [
      'obtenerBuffetDelAlumno',
      'getProductosDelBuffet',
    ]);
    buffetServiceMock.obtenerBuffetDelAlumno.and.returnValue(of({
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      nombre: 'Buffet',
      colegioId: 'colegio-1',
    }));
    buffetServiceMock.getProductosDelBuffet.and.returnValue(of([]));
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
