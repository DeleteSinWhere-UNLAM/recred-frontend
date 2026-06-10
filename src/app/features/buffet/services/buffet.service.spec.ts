import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { BuffetService } from './buffet.service';

describe('BuffetService', () => {
  let service: BuffetService;
  let httpMock: HttpTestingController;

  const alumnoId = '345c0add-4188-489f-a290-bf1ab68b260a';

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

  describe('mapMenuProductDtoToProducto — separación de tipos de bloqueo', () => {

    it('debería mapear bloqueado=true y bloqueadoPorRestriccion=false si el motivo es "Bloqueado por el tutor"', (done) => {
      const mockDtos = [{
        id: 'prod-1', nombre: 'Coca Cola', precio: 1000,
        bloqueado: true, motivoBloqueo: 'Bloqueado por el tutor'
      }];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].bloqueado).toBeTrue();
          expect(productos[0].bloqueadoPorRestriccion).toBeFalsy();
          expect(productos[0].motivoBloqueo).toBe('Bloqueado por el tutor');
          expect(productos[0].estadoStock).toBe('SIN_STOCK');
          done();
        }
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).flush(mockDtos);
    });

    it('debería mapear bloqueadoPorRestriccion=true y bloqueado=false si el motivo es una restricción nutricional', (done) => {
      const mockDtos = [{
        id: 'prod-2', nombre: 'Galletitas Oreo', precio: 500,
        bloqueado: true, motivoBloqueo: 'Contiene: Gluten (TACC)'
      }];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].bloqueado).toBeFalsy();
          expect(productos[0].bloqueadoPorRestriccion).toBeTrue();
          expect(productos[0].motivoBloqueo).toBe('Contiene: Gluten (TACC)');
          expect(productos[0].estadoStock).toBe('SIN_STOCK');
          done();
        }
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).flush(mockDtos);
    });

    it('debería mapear bloqueadoPorRestriccion=true para restricción de lácteos', (done) => {
      const mockDtos = [{
        id: 'prod-3', nombre: 'Leche Entera', precio: 400,
        bloqueado: true, motivoBloqueo: 'Contiene: Lácteos'
      }];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].bloqueado).toBeFalsy();
          expect(productos[0].bloqueadoPorRestriccion).toBeTrue();
          expect(productos[0].motivoBloqueo).toBe('Contiene: Lácteos');
          done();
        }
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).flush(mockDtos);
    });

    it('debería mapear bloqueadoPorRestriccion=true para restricción horaria', (done) => {
      const mockDtos = [{
        id: 'prod-4', nombre: 'Alfajor', precio: 600,
        bloqueado: true, motivoBloqueo: 'No permitido en este horario'
      }];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].bloqueado).toBeFalsy();
          expect(productos[0].bloqueadoPorRestriccion).toBeTrue();
          done();
        }
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).flush(mockDtos);
    });

    it('debería mapear superaPresupuesto=true y bloqueado=false para motivos de presupuesto general', (done) => {
      const mockDtos = [{
        id: 'prod-5', nombre: 'Hamburguesa', precio: 2000,
        bloqueado: true, motivoBloqueo: 'Supera el límite de gasto'
      }];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].bloqueado).toBeFalsy();
          expect(productos[0].bloqueadoPorRestriccion).toBeFalsy();
          expect(productos[0].superaPresupuesto).toBeTrue();
          expect(productos[0].estadoStock).toBe('DISPONIBLE');
          done();
        }
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).flush(mockDtos);
    });

    it('debería mapear superaPresupuesto=true para motivo de presupuesto por categoría', (done) => {
      const mockDtos = [{
        id: 'prod-6', nombre: 'Pizza', precio: 1800,
        bloqueado: true, motivoBloqueo: 'Supera límite de su categoría'
      }];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].superaPresupuesto).toBeTrue();
          expect(productos[0].bloqueado).toBeFalsy();
          expect(productos[0].bloqueadoPorRestriccion).toBeFalsy();
          done();
        }
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).flush(mockDtos);
    });

    it('debería mapear un producto sin bloqueo como disponible y sin restricciones', (done) => {
      const mockDtos = [{
        id: 'prod-7', nombre: 'Agua Mineral', precio: 300,
        bloqueado: false, motivoBloqueo: null
      }];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].bloqueado).toBeFalsy();
          expect(productos[0].bloqueadoPorRestriccion).toBeFalsy();
          expect(productos[0].superaPresupuesto).toBeFalsy();
          expect(productos[0].estadoStock).toBe('DISPONIBLE');
          done();
        }
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).flush(mockDtos);
    });

    it('debería preservar el motivoBloqueo en el objeto Producto mapeado', (done) => {
      const motivo = 'Contiene: Gluten (TACC), Azúcar';
      const mockDtos = [{
        id: 'prod-8', nombre: 'Pepitos', precio: 400,
        bloqueado: true, motivoBloqueo: motivo
      }];

      service.getProductosDelBuffet('buffet-1', alumnoId).subscribe({
        next: (productos) => {
          expect(productos[0].motivoBloqueo).toBe(motivo);
          done();
        }
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).flush(mockDtos);
    });
  });
});
