import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { MovimientosService } from './movimientos.service';
import { Movimiento } from '../models/movimiento.model';

describe('MovimientosService', () => {
  let service: MovimientosService;
  let httpMock: HttpTestingController;

  const mockMovimientos: Movimiento[] = [
    {
      id: 'mov-1',
      studentId: 'alumno-123',
      totalAmount: 1500,
      status: 'APPROVED',
      statusLabel: 'Aprobado',
      paymentMethod: 'CREDIT',
      date: '2026-06-07T10:00:00Z',
      items: [
        { productId: 'prod-1', productName: 'Tostado', quantity: 1, unitPrice: 1500 }
      ]
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MovimientosService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MovimientosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('getHistorialAlumno debería llamar a /purchases/alumno/:id cuando el id es un UUID', (done) => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    service.getHistorialAlumno(uuid).subscribe({
      next: (movimientos) => {
        expect(movimientos).toEqual(mockMovimientos);
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/alumno/${uuid}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMovimientos);
  });

  it('getHistorialAlumno debería retornar mock de movimientos cuando el id no es un UUID', (done) => {
    service.getHistorialAlumno('julian-garcia').subscribe({
      next: (movimientos) => {
        expect(movimientos.length).toBeGreaterThan(0);
        expect(movimientos[0].studentId).toBe('julian-garcia');
        done();
      }
    });

  });

  it('getHistorialTutor debería llamar a /purchases/tutor/me', (done) => {
    service.getHistorialTutor().subscribe({
      next: (movimientos) => {
        expect(movimientos).toEqual(mockMovimientos);
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/tutor/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMovimientos);
  });

  it('getPendientesAlumno debería llamar a /purchases/alumno/:id/pendientes cuando el id es un UUID', (done) => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    service.getPendientesAlumno(uuid).subscribe({
      next: (movimientos) => {
        expect(movimientos).toEqual(mockMovimientos);
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/alumno/${uuid}/pendientes`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMovimientos);
  });

  it('getPendientesAlumno debería retornar mock filtrado cuando el id no es un UUID', (done) => {
    service.getPendientesAlumno('julian-garcia').subscribe({
      next: (movimientos) => {
        expect(movimientos.length).toBeGreaterThan(0);
        const hasOtherStatus = movimientos.some(m => m.status !== 'PENDING' && m.status !== 'EN_PREPARACION' && m.status !== 'LISTO');
        expect(hasOtherStatus).toBeFalse();
        done();
      }
    });
  });

  it('cancelarCompra debería hacer PUT a /purchases/:id/cancel', (done) => {
    service.cancelarCompra('mov-123').subscribe({
      next: () => {
        expect(true).toBeTrue();
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/mov-123/cancel`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});
