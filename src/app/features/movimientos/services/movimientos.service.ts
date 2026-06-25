import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Movimiento } from '../models/movimiento.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MovimientosService {
  private readonly http = inject(HttpClient);

  getHistorialAlumno(alumnoId: string): Observable<Movimiento[]> {
    if (!this.isUuid(alumnoId)) {
      return of(this.getMockMovimientos(alumnoId));
    }
    return this.http.get<Movimiento[]>(`${environment.apiUrl}/purchases/alumno/${alumnoId}`);
  }

  getPendientesAlumno(alumnoId: string): Observable<Movimiento[]> {
    if (!this.isUuid(alumnoId)) {
      const mock = this.getMockMovimientos(alumnoId);
      return of(mock.filter(m => m.status === 'PENDING' || m.status === 'EN_PREPARACION' || m.status === 'LISTO'));
    }
    return this.http.get<Movimiento[]>(`${environment.apiUrl}/purchases/alumno/${alumnoId}/pendientes`);
  }

  getHistorialTutor(): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${environment.apiUrl}/purchases/tutor/me`);
  }

  cancelarCompra(id: string): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/purchases/${id}/cancel`, {});
  }

  private isUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  private getMockMovimientos(alumnoId: string): Movimiento[] {
    return [
      {
        id: 'mov-mock-1',
        studentId: alumnoId,
        totalAmount: 1800,
        status: 'APPROVED',
        statusLabel: 'Aprobado',
        paymentMethod: 'DEBIT',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        items: [
          { productId: 'prod-1', productName: 'Tostado de jamón y queso', quantity: 1, unitPrice: 1200 },
          { productId: 'prod-2', productName: 'Jugo de Naranja Cepita 500ml', quantity: 1, unitPrice: 600 }
        ]
      },
      {
        id: 'mov-mock-2',
        studentId: alumnoId,
        totalAmount: 900,
        status: 'PENDING',
        statusLabel: 'Pendiente',
        paymentMethod: 'DEBIT',
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        items: [
          { productId: 'prod-3', productName: 'Alfajor Jorgito chocolate', quantity: 1, unitPrice: 500 },
          { productId: 'prod-4', productName: 'Turrón de Maní Arcor', quantity: 2, unitPrice: 200 }
        ]
      },
      {
        id: 'mov-mock-3',
        studentId: alumnoId,
        totalAmount: 1500,
        status: 'REJECTED',
        statusLabel: 'Rechazado',
        paymentMethod: 'CREDIT',
        date: new Date(Date.now() - 3600000 * 48).toISOString(),
        items: [
          { productId: 'prod-5', productName: 'Coca-Cola Original 500ml', quantity: 1, unitPrice: 1500 }
        ]
      },
      {
        id: 'mov-mock-4',
        studentId: alumnoId,
        totalAmount: 800,
        status: 'APPROVED',
        statusLabel: 'Aprobado',
        paymentMethod: 'DEBIT',
        date: new Date(Date.now() - 3600000 * 72).toISOString(),
        items: [
          { productId: 'prod-6', productName: 'Barra de Cereal Saladix', quantity: 2, unitPrice: 400 }
        ]
      }
    ];
  }
}
