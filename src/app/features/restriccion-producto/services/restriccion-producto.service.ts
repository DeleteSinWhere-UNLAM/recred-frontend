import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RestriccionProductoService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/v\d+\/?$/, '');

  bloquearProducto(alumnoId: string, productoId: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/control-parental/alumnos/${alumnoId}/productos-bloqueados/${productoId}`,
      {}
    );
  }

  desbloquearProducto(alumnoId: string, productoId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/control-parental/alumnos/${alumnoId}/productos-bloqueados/${productoId}`
    );
  }
}
