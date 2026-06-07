import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movimiento } from '../models/movimiento.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MovimientosService {
  private readonly http = inject(HttpClient);

  getHistorialAlumno(alumnoId: string): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${environment.apiUrl}/purchases/alumno/${alumnoId}`);
  }

  getHistorialTutor(): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${environment.apiUrl}/purchases/tutor/me`);
  }
}
