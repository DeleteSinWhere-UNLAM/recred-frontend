import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { BuffetService } from './buffet.service';

describe('BuffetService', () => {
  let service: BuffetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BuffetService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BuffetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  describe('mapMenuProductDtoToProducto', () => {
    it('debería mapear bloqueado en true si el motivo es "Bloqueado por el tutor"', (done) => {
      const alumnoId = '345c0add-4188-489f-a290-bf1ab68b260a';
      const mockDtos = [
        {
          id: 'prod-1',
          nombre: 'Coca Cola',
          precio: 1000,
          bloqueado: true,
          motivoBloqueo: 'Bloqueado por el tutor'
        }
      ];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].bloqueado).toBeTrue();
          expect(productos[0].estadoStock).toBe('SIN_STOCK');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDtos);
    });

    it('debería mapear bloqueado en false si el motivo de bloqueo NO es "Bloqueado por el tutor"', (done) => {
      const alumnoId = '345c0add-4188-489f-a290-bf1ab68b260a';
      const mockDtos = [
        {
          id: 'prod-2',
          nombre: 'Alfajor',
          precio: 500,
          bloqueado: true,
          motivoBloqueo: 'Supera el límite de gasto'
        }
      ];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].bloqueado).toBeFalse();
          expect(productos[0].superaPresupuesto).toBeTrue();
          expect(productos[0].estadoStock).toBe('DISPONIBLE');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDtos);
    });
  });
});
